'use strict';

const {modelNames, pascalCase} = require('../naming');
const {
  findSchemaPath,
  appendModel,
  readSchema,
} = require('../prisma-schema');
const {promptModelName, promptModelFields} = require('../prompts');
const {projectRoot} = require('../write');

/**
 * Interactive model generator — appends to prisma/schema.prisma
 */
async function generateModel(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);

  const {name: rawName} = await promptModelName(args.name || args._?.[0], opts);
  const names = modelNames(pascalCase(rawName));
  const {fields} = await promptModelFields(opts);

  appendModel(schemaPath, names.pascal, fields);
  const {models} = readSchema(schemaPath);

  return {
    type: 'model',
    model: names.pascal,
    schemaPath,
    fields,
    models: models.map(m => m.name),
  };
}

module.exports = {generateModel};
