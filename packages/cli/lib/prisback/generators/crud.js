'use strict';

const path = require('path');
const {modelNames, pascalCase} = require('../naming');
const {
  findSchemaPath,
  readSchema,
  getModel,
} = require('../prisma-schema');
const {promptSelectModel, promptCrudMode} = require('../prompts');
const {writeFile, projectRoot} = require('../write');
const {
  generateDtoFile,
  generateRepositoryFile,
  generateControllerFile,
  generateModuleFile,
} = require('./templates');

/**
 * Generate Nest-style module: dto + repository + controller + module
 */
async function generateCrud(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);
  const {models} = readSchema(schemaPath);

  const {model: modelName} = await promptSelectModel(
    models,
    args.name || args.model || args._?.[0],
    opts,
  );
  const {mode} = await promptCrudMode(opts);
  const empty = mode === 'empty';
  const model = getModel(models, modelName);
  const names = modelNames(pascalCase(model.name));
  const force = Boolean(opts.force);

  const files = [];

  const dto = generateDtoFile({names, fields: model.fields});
  files.push({
    relative: path.join(names.moduleDir, `${names.kebab}.dto.ts`),
    content: dto,
  });

  files.push({
    relative: path.join(names.moduleDir, `${names.kebab}.repository.ts`),
    content: generateRepositoryFile({names, fields: model.fields, empty}),
  });

  files.push({
    relative: path.join(names.moduleDir, `${names.kebab}.controller.ts`),
    content: generateControllerFile({names, fields: model.fields, empty}),
  });

  files.push({
    relative: path.join(names.moduleDir, `${names.kebab}.module.ts`),
    content: generateModuleFile({names}),
  });

  const written = files.map(f => ({
    relative: f.relative,
    file: writeFile(root, f.relative, f.content, {force}),
  }));

  return {
    type: 'crud',
    model: names.pascal,
    mode,
    empty,
    moduleDir: names.moduleDir,
    files: written,
  };
}

module.exports = {generateCrud};
