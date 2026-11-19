'use strict';

const {modelNames, pascalCase} = require('../naming');
const {
  findSchemaPath,
  appendModel,
  readSchema,
  readDatasourceProvider,
} = require('../prisma-schema');
const {promptModelName, promptModelFields} = require('../prompts');
const {projectRoot} = require('../write');

/**
 * Interactive model generator — appends to prisma/schema.prisma
 * PK shape follows datasource provider (Mongo ObjectId vs SQL autoincrement).
 */
async function generateModel(args = {}, opts = {}) {
  const root = opts.cwd || projectRoot();
  const schemaPath = opts.schemaPath || findSchemaPath(root);
  const provider =
    opts.provider || readDatasourceProvider(schemaPath);

  const {name: rawName} = await promptModelName(args.name || args._?.[0], opts);
  const names = modelNames(pascalCase(rawName));
  const {fields} = await promptModelFields({...opts, provider});

  appendModel(schemaPath, names.pascal, fields, {provider});
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
