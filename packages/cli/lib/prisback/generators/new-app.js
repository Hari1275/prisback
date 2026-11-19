'use strict';

const path = require('path');
const fs = require('fs-extra');
const {ask, promptDatabaseProvider} = require('../prompts');
const {projectRoot, writeFile} = require('../write');
const {
  appNames,
  packageJson,
  tsconfigJson,
  prismaSchema,
  envExample,
  gitignore,
  applicationTs,
  securityTs,
  indexTs,
  pingControllerTs,
  healthControllerTs,
  publicIndexHtml,
  publicExplorerHtml,
  appReadme,
} = require('./new-app-templates');

function isPrisbackMonorepo(dir) {
  return (
    fs.existsSync(path.join(dir, 'packages', 'core', 'package.json')) &&
    fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))
  );
}

async function promptNewApp(args, opts = {}) {
  let name = args.name || args._?.[0];
  if (!name && opts.nonInteractive) name = 'my-api';
  if (!name) {
    const a = await ask(
      [
        {
          type: 'text',
          name: 'name',
          message: 'Application name',
          initial: 'my-api',
          validate: v =>
            v && /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(v)
              ? true
              : 'Use letters, numbers, - or _',
        },
      ],
      opts,
    );
    name = a.name;
  }

  let outDir = opts.outdir || opts.outDir || name;
  if (!opts.nonInteractive && !opts.outdir && !opts.outDir && !args._?.[0]) {
    const a = await ask(
      [
        {
          type: 'text',
          name: 'outdir',
          message: 'Directory',
          initial: name,
        },
      ],
      opts,
    );
    outDir = a.outdir || name;
  } else if (args._?.[0] && !opts.outdir) {
    outDir = opts.outdir || name;
  }

  return {name, outDir};
}

/**
 * Scaffold a new PrisBack application.
 */
async function generateNewApp(args = {}, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const {name, outDir} = await promptNewApp(args, opts);
  const {provider} = await promptDatabaseProvider({
    ...opts,
    provider: opts.provider || args.provider,
  });
  const names = appNames(name);
  const target = path.isAbsolute(outDir) ? outDir : path.join(cwd, outDir);

  if (fs.existsSync(target) && fs.readdirSync(target).length && !opts.force) {
    throw new Error(
      `Directory not empty: ${target} (use --force to write into it)`,
    );
  }

  fs.ensureDirSync(target);

  const workspace = isPrisbackMonorepo(cwd) || isPrisbackMonorepo(path.dirname(cwd));
  const files = [];

  const write = (rel, content) => {
    const abs = writeFile(target, rel, content, {force: true});
    files.push({relative: rel, file: abs});
  };

  write(
    'package.json',
    JSON.stringify(packageJson(names, {workspace}), null, 2) + '\n',
  );
  write('tsconfig.json', JSON.stringify(tsconfigJson(), null, 2) + '\n');
  write('prisma/schema.prisma', prismaSchema(provider));
  write('.env.example', envExample(provider));
  write('.gitignore', gitignore());
  write('README.md', appReadme(names));
  write('src/application.ts', applicationTs(names));
  write('src/config/security.ts', securityTs());
  write('src/index.ts', indexTs(names));
  write('src/controllers/ping.controller.ts', pingControllerTs());
  write('src/controllers/health.controller.ts', healthControllerTs());
  write('public/index.html', publicIndexHtml(names));
  write('public/explorer/index.html', publicExplorerHtml(names));

  return {
    type: 'new',
    model: names.pascal,
    name: names.packageName,
    className: names.className,
    outDir: target,
    workspace,
    provider,
    files,
  };
}

module.exports = {generateNewApp, appNames, isPrisbackMonorepo};
