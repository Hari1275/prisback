'use strict';

const path = require('path');
const {modelNames, pascalCase} = require('../naming');
const {
  findSchemaPath,
  readSchema,
  getModel,
} = require('../prisma-schema');
const {promptSelectModel, promptControllerType} = require('../prompts');
const {writeFile, projectRoot} = require('../write');
const {generateControllerFile} = require('./templates');

async function generateController(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);
  const {models} = readSchema(schemaPath);

  const {model: modelName} = await promptSelectModel(
    models,
    args.name || args.model || args._?.[0],
    opts,
  );
  const {type} = await promptControllerType(opts);
  const empty = type === 'empty';
  const model = getModel(models, modelName);
  const names = modelNames(pascalCase(model.name));

  const content = generateControllerFile({
    names,
    fields: model.fields,
    empty,
  });
  const relative = path.join(names.moduleDir, `${names.kebab}.controller.ts`);
  const file = writeFile(root, relative, content, {force: opts.force});

  return {type: 'controller', model: names.pascal, file, relative, empty};
}

module.exports = {generateController};
