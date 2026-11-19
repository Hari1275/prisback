'use strict';

const chalk = require('chalk');
const {runGenerator, GENERATORS} = require('./generators');
const {generateNewApp} = require('./generators/new-app');
const {serveApp} = require('./serve');

const GENERATE_ALIASES = new Set(['g', 'generate']);
const TOP_LEVEL = new Set(['new', 'serve']);

function printPrisbackHelp(log = console.log) {
  log(`
${chalk.bold('PrisBack CLI')} — Prisma-first backend framework

Usage:
  prisback new <name>              Scaffold a starter API
  prisback serve                   Run dist/index.js (OpenAPI at /openapi.json)
  prisback generate <gen> [name]   Generators (alias: g)

Generators:
  model         Add a model to prisma/schema.prisma
  crud          DTO + repository + controller + module
  repository    Prisma repository only
  controller    Empty or REST CRUD controller
  relation      Prisma relation + nested REST (LB4 prompts)
  auth          Basic JWT auth

Examples:
  prisback new my-api
  prisback new my-api --provider mongodb
  cd my-api && npm install && npx prisma generate && npm run build && npm start
  # → http://127.0.0.1:3000/ping
  # → http://127.0.0.1:3000/openapi.json

  prisback g crud User
  prisback g relation --type hasMany --source User --target Post
  prisback g auth

Options:
  --provider <name>  sqlite | postgresql | mysql | mongodb (for new)
  --empty / --type / --source / --target / --userModel / --register
  --port <n>       For serve
  --force          Overwrite
  --schema <path>  schema.prisma path
  -h, --help
`);
}

function isPrisbackCommand(opts) {
  const args = opts._ || [];
  const cmd = args[0];
  if (!cmd) return false;
  if (TOP_LEVEL.has(cmd)) return true;
  if (GENERATE_ALIASES.has(cmd)) return true;
  if (cmd in GENERATORS) return true;
  return false;
}

async function runPrisbackCommand(opts, log = console.log) {
  const args = [...(opts._ || [])];
  let cmd = args.shift();

  if (opts.help || cmd === 'help') {
    printPrisbackHelp(log);
    return;
  }

  // Top-level: new / serve
  if (cmd === 'new') {
    const result = await generateNewApp(
      {name: args[0], _: args, provider: opts.provider},
      {
        cwd: opts.cwd || process.cwd(),
        outdir: opts.outdir || opts.outDir,
        force: Boolean(opts.force),
        nonInteractive: Boolean(opts.yes || opts.nonInteractive),
        provider: opts.provider,
      },
    );
    log(chalk.green(`✔ Created PrisBack app ${result.name}`));
    log(`  ${result.outDir}`);
    log(`  database: ${result.provider}`);
    for (const f of result.files) log(`  ${f.relative}`);
    log('');
    log('Next:');
    log(`  cd ${pathBasename(result.outDir)}`);
    log('  cp .env.example .env   # set DATABASE_URL for your provider');
    log('  npm install && npx prisma generate');
    log('  npx prisma db push');
    log('  npm run build && npm start');
    log('  # OpenAPI: http://127.0.0.1:3000/openapi.json');
    return result;
  }

  if (cmd === 'serve') {
    return serveApp(
      {
        cwd: opts.cwd,
        port: opts.port,
        dryRun: Boolean(opts.dryRun || opts['dry-run']),
      },
      log,
    );
  }

  let generatorName;
  if (GENERATE_ALIASES.has(cmd)) {
    generatorName = args.shift();
  } else if (cmd in GENERATORS) {
    generatorName = cmd;
  }

  if (!generatorName || !(generatorName in GENERATORS)) {
    printPrisbackHelp(log);
    throw new Error(
      generatorName
        ? `Unknown generator "${generatorName}"`
        : 'Missing generator name',
    );
  }

  const nameArg = args[0];
  const result = await runGenerator(
    generatorName,
    {
      name: nameArg,
      model: nameArg,
      source: opts.source || args[0],
      target: opts.target || args[1],
      type: opts.type,
      _: args,
    },
    {
      empty: Boolean(opts.empty),
      mode: opts.empty ? 'empty' : opts.mode,
      type: opts.type,
      relationType: opts.relationType || opts.type,
      sourceModel: opts.source,
      targetModel: opts.target,
      foreignKey: opts.foreignKey || opts['foreign-key'],
      relationName: opts.relationName || opts['relation-name'],
      throughModel: opts.throughModel || opts.through,
      generateEndpoints:
        opts.endpoints !== false && opts['no-endpoints'] !== true,
      strategy: opts.strategy || 'jwt',
      userModel: opts.userModel || opts['user-model'],
      register: opts.register !== undefined ? Boolean(opts.register) : undefined,
      force: Boolean(opts.force),
      schemaPath: opts.schema,
      cwd: opts.cwd,
      nonInteractive: Boolean(opts.yes || opts.nonInteractive),
      fields: opts.fields,
    },
  );

  log(
    chalk.green(
      `✔ Generated ${result.type}${result.model ? ` for ${result.model}` : ''}${
        result.relationType ? ` (${result.relationType})` : ''
      }`,
    ),
  );
  if (result.schemaPath) log(`  schema: ${result.schemaPath}`);
  if (result.relative) log(`  ${result.relative}`);
  if (result.files) {
    for (const f of result.files) log(`  ${f.relative}`);
  }
  if (result.moduleUpdated) log(`  updated module registration`);
  return result;
}

function pathBasename(p) {
  return require('path').basename(p);
}

module.exports = {
  isPrisbackCommand,
  runPrisbackCommand,
  printPrisbackHelp,
  GENERATORS,
};
