'use strict';

const path = require('path');
const fs = require('fs-extra');
const {pascalCase} = require('../naming');
const {
  findSchemaPath,
  readSchema,
  appendModel,
  parseSchema,
} = require('../prisma-schema');
const {ask, promptSelectModel} = require('../prompts');
const {writeFile, projectRoot} = require('../write');
const {
  generateAuthDto,
  generateAuthService,
  generateAuthController,
  generateAuthModule,
  generateEnvExample,
  generateAppSnippet,
} = require('./auth-templates');

async function promptAuthOptions(models, opts = {}) {
  let strategy = opts.strategy || 'jwt';
  if (!opts.nonInteractive && !opts.strategy) {
    const a = await ask(
      [
        {
          type: 'select',
          name: 'strategy',
          message: 'Authentication strategy',
          choices: [{title: 'JWT (basic email/password)', value: 'jwt'}],
          initial: 0,
        },
      ],
      opts,
    );
    strategy = a.strategy || 'jwt';
  }

  let userModel = opts.userModel || opts.model;
  if (!userModel) {
    if (models.some(m => m.name === 'User')) userModel = 'User';
    else if (opts.nonInteractive) userModel = 'User';
    else if (models.length) {
      const a = await promptSelectModel(models, undefined, {
        ...opts,
        // reuse select with custom message via override not available — select first then confirm create
      });
      userModel = a.model;
    } else {
      userModel = 'User';
    }
  }
  userModel = pascalCase(userModel);

  let includeRegister = opts.register;
  if (includeRegister === undefined && opts.nonInteractive) {
    includeRegister = true;
  }
  if (includeRegister === undefined) {
    const a = await ask(
      [
        {
          type: 'confirm',
          name: 'register',
          message: 'Include POST /auth/register endpoint?',
          initial: true,
        },
      ],
      opts,
    );
    includeRegister = a.register !== false;
  }

  return {
    strategy,
    userModel,
    includeRegister: Boolean(includeRegister),
  };
}

function ensureUserModel(schemaPath, userModel) {
  let content = '';
  if (fs.existsSync(schemaPath)) {
    content = fs.readFileSync(schemaPath, 'utf8');
  }
  const models = content ? parseSchema(content) : [];
  const existing = models.find(m => m.name === userModel);
  if (existing) {
    const hasEmail = existing.fields.some(f => f.name === 'email');
    const hasPassword = existing.fields.some(f => f.name === 'password');
    if (hasEmail && hasPassword) {
      return {created: false, updated: false};
    }
    // Patch missing fields
    let next = content;
    const insert = [];
    if (!hasEmail) insert.push('  email String @unique');
    if (!hasPassword) insert.push('  password String');
    if (insert.length) {
      const re = new RegExp(`(model\\s+${userModel}\\s*\\{)([\\s\\S]*?)(\\n\\})`);
      next = next.replace(re, (full, start, body, end) => {
        return `${start}${body.replace(/\s*$/, '\n')}${insert.join('\n')}\n${end}`;
      });
      fs.writeFileSync(schemaPath, next);
      return {created: false, updated: true};
    }
    return {created: false, updated: false};
  }

  appendModel(schemaPath, userModel, [
    {name: 'id', type: 'Int', isId: true, hasDefault: true, isOptional: false},
    {name: 'email', type: 'String', isOptional: false, isUnique: true},
    {name: 'password', type: 'String', isOptional: false},
    {name: 'name', type: 'String', isOptional: true},
  ]);
  // Fix unique on email — appendModel uses isUnique
  let written = fs.readFileSync(schemaPath, 'utf8');
  written = written.replace(
    new RegExp(`(model\\s+${userModel}\\s*\\{[\\s\\S]*?email\\s+String)(?!\\s+@unique)`),
    '$1 @unique',
  );
  fs.writeFileSync(schemaPath, written);
  return {created: true, updated: false};
}

/**
 * Generate basic JWT auth module into the app.
 */
async function generateAuth(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);

  let models = [];
  try {
    models = readSchema(schemaPath).models;
  } catch {
    models = [];
  }

  const options = await promptAuthOptions(models, {
    ...opts,
    userModel: opts.userModel || args.name || args.model || args._?.[0],
  });

  fs.ensureDirSync(path.dirname(schemaPath));
  const schemaResult = ensureUserModel(schemaPath, options.userModel);

  const files = [];
  const dir = 'src/modules/auth';

  files.push({
    relative: path.join(dir, 'auth.dto.ts'),
    file: writeFile(root, path.join(dir, 'auth.dto.ts'), generateAuthDto(), {
      force: opts.force,
    }),
  });
  files.push({
    relative: path.join(dir, 'auth.service.ts'),
    file: writeFile(
      root,
      path.join(dir, 'auth.service.ts'),
      generateAuthService({userModel: options.userModel}),
      {force: opts.force},
    ),
  });
  files.push({
    relative: path.join(dir, 'auth.controller.ts'),
    file: writeFile(
      root,
      path.join(dir, 'auth.controller.ts'),
      generateAuthController({includeRegister: options.includeRegister}),
      {force: opts.force},
    ),
  });
  files.push({
    relative: path.join(dir, 'auth.module.ts'),
    file: writeFile(
      root,
      path.join(dir, 'auth.module.ts'),
      generateAuthModule({includeRegister: options.includeRegister}),
      {force: opts.force},
    ),
  });

  const envPath = path.join(root, '.env.example');
  if (!fs.existsSync(envPath) || opts.force) {
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (!existing.includes('JWT_SECRET')) {
      fs.writeFileSync(
        envPath,
        (existing ? existing.replace(/\s*$/, '\n') : '') + generateEnvExample(),
      );
    }
  }

  const snippetPath = path.join(dir, 'AUTH_SETUP.md');
  files.push({
    relative: snippetPath,
    file: writeFile(root, snippetPath, generateAppSnippet(), {force: true}),
  });

  // Ensure package.json lists @prisback/authentication if present
  const pkgPath = path.join(root, 'package.json');
  let packageUpdated = false;
  if (fs.existsSync(pkgPath)) {
    const pkg = fs.readJsonSync(pkgPath);
    pkg.dependencies = pkg.dependencies || {};
    if (!pkg.dependencies['@prisback/authentication']) {
      pkg.dependencies['@prisback/authentication'] = 'workspace:*';
      fs.writeJsonSync(pkgPath, pkg, {spaces: 2});
      packageUpdated = true;
    }
  }

  return {
    type: 'auth',
    model: options.userModel,
    strategy: options.strategy,
    includeRegister: options.includeRegister,
    schemaPath,
    schemaResult,
    files,
    packageUpdated,
  };
}

module.exports = {generateAuth, ensureUserModel, promptAuthOptions};
