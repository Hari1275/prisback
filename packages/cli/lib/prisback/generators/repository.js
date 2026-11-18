'use strict';

const path = require('path');
const {modelNames, pascalCase} = require('../naming');
const {
  findSchemaPath,
  readSchema,
  getModel,
} = require('../prisma-schema');
const {promptSelectModel} = require('../prompts');
const {writeFile, projectRoot} = require('../write');
const {generateRepositoryFile} = require('./templates');

async function generateRepository(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);
  const {models} = readSchema(schemaPath);

  const {model: modelName} = await promptSelectModel(
    models,
    args.name || args.model || args._?.[0],
    opts,
  );
  const model = getModel(models, modelName);
  const names = modelNames(pascalCase(model.name));
  const empty = Boolean(opts.empty);

  const content = generateRepositoryFile({
    names,
    fields: model.fields,
    empty,
  });
  const relative = path.join(names.moduleDir, `${names.kebab}.repository.ts`);
  const file = writeFile(root, relative, content, {force: opts.force});

  return {type: 'repository', model: names.pascal, file, relative, empty};
}

module.exports = {generateRepository};
