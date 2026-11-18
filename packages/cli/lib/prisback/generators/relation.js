'use strict';

const path = require('path');
const fs = require('fs-extra');
const {modelNames} = require('../naming');
const {
  findSchemaPath,
  readSchema,
} = require('../prisma-schema');
const {promptRelation} = require('../prompts');
const {applyRelationToSchemaFile} = require('../relation-schema');
const {writeFile, projectRoot} = require('../write');
const {
  generateRelationController,
  generateRelationRepositoryFile,
  generateRelationModuleSnippet,
} = require('./relation-templates');

/**
 * Interactive relation generator (LB4 skill + Prisma schema).
 */
async function generateRelation(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);
  const {models} = readSchema(schemaPath);

  const answers = await promptRelation(models, {
    ...opts,
    sourceModel: opts.sourceModel || args.source || args._?.[0],
    targetModel: opts.targetModel || args.target || args._?.[1],
    relationType: opts.relationType || opts.type || args.type,
  });

  const resolved = applyRelationToSchemaFile(schemaPath, answers, models);
  const source = modelNames(resolved.sourceModel);
  const target = modelNames(resolved.targetModel);
  const files = [];

  const repoContent = generateRelationRepositoryFile({resolved});
  const repoRel = path.join(
    source.moduleDir,
    'relations',
    `${source.kebab}-${target.kebab}.repository.ts`,
  );
  files.push({
    relative: repoRel,
    file: writeFile(root, repoRel, repoContent, {force: opts.force}),
  });

  if (answers.generateEndpoints !== false) {
    const controllerContent = generateRelationController({
      resolved,
      sourceIdType: resolved.sourceIdType,
    });
    const ctrlRel = path.join(
      source.moduleDir,
      'relations',
      `${source.kebab}-${target.kebab}.controller.ts`,
    );
    files.push({
      relative: ctrlRel,
      file: writeFile(root, ctrlRel, controllerContent, {force: opts.force}),
    });
  }

  // Best-effort: register in existing module if present
  const modulePath = path.join(root, source.moduleDir, `${source.kebab}.module.ts`);
  let moduleUpdated = false;
  if (fs.existsSync(modulePath) && answers.generateEndpoints !== false) {
    const snippet = generateRelationModuleSnippet({resolved});
    let mod = fs.readFileSync(modulePath, 'utf8');
    if (!mod.includes(snippet.controllerClass)) {
      if (!mod.includes(snippet.controllerFile)) {
        mod =
          `import {${snippet.controllerClass}} from '${snippet.controllerFile}';\n` +
          `import {${snippet.repositoryClass}} from '${snippet.repositoryFile}';\n` +
          mod;
      }
      mod = mod.replace(
        /controllers:\s*\[([^\]]*)\]/,
        (m, inner) =>
          `controllers: [${inner.trim() ? inner.trim() + ', ' : ''}${snippet.controllerClass}]`,
      );
      mod = mod.replace(
        /providers:\s*\[([^\]]*)\]/,
        (m, inner) =>
          `providers: [${inner.trim() ? inner.trim() + ', ' : ''}${snippet.repositoryClass}]`,
      );
      fs.writeFileSync(modulePath, mod);
      moduleUpdated = true;
    }
  }

  return {
    type: 'relation',
    model: `${resolved.sourceModel}.${resolved.relationName}`,
    relationType: resolved.relationType,
    sourceModel: resolved.sourceModel,
    targetModel: resolved.targetModel,
    relationName: resolved.relationName,
    foreignKey: resolved.foreignKey,
    schemaPath,
    files,
    moduleUpdated,
    resolved,
  };
}

module.exports = {generateRelation};
