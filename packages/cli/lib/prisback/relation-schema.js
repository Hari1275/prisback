'use strict';

const fs = require('fs-extra');
const {camelCase, pascalCase, pluralize} = require('./naming');
const {relationType} = require('./relation-types');
const {idField, parseSchema} = require('./prisma-schema');

function defaultRelationName(type, targetName) {
  const camel = camelCase(targetName);
  if (
    type === relationType.hasMany ||
    type === relationType.hasManyThrough ||
    type === relationType.referencesMany
  ) {
    return pluralize(camel);
  }
  return camel;
}

function defaultForeignKey(sourceName) {
  return `${camelCase(sourceName)}Id`;
}

function defaultThroughModel(sourceName, targetName) {
  return `${pascalCase(sourceName)}${pascalCase(pluralize(targetName))}`;
}

/**
 * Insert field lines into a model block if missing.
 */
function insertFieldsIntoModel(content, modelName, lines) {
  const re = new RegExp(`(model\\s+${modelName}\\s*\\{)([\\s\\S]*?)(\\n\\})`);
  if (!re.test(content)) {
    throw new Error(`Model "${modelName}" not found in schema`);
  }
  return content.replace(re, (full, start, body, end) => {
    const toAdd = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const fieldName = trimmed.split(/\s+/)[0];
      const exists = new RegExp(`(^|\\n)\\s*${fieldName}\\s+`, 'm').test(body);
      if (!exists) toAdd.push(trimmed.startsWith('@@') ? `  ${trimmed}` : `  ${trimmed}`);
    }
    if (!toAdd.length) return full;
    const bodyTrim = body.replace(/\s*$/, '\n');
    return `${start}${bodyTrim}${toAdd.join('\n')}\n${end}`;
  });
}

function ensureThroughModel(content, throughName, source, target, sourceFk, targetFk, sourceIdType, targetIdType) {
  if (parseSchema(content).some(m => m.name === throughName)) {
    return content;
  }
  const block = `
model ${throughName} {
  ${sourceFk} ${sourceIdType}
  ${targetFk} ${targetIdType}
  ${camelCase(source)} ${source} @relation(fields: [${sourceFk}], references: [id])
  ${camelCase(target)} ${target} @relation(fields: [${targetFk}], references: [id])

  @@id([${sourceFk}, ${targetFk}])
}
`;
  return content.replace(/\s*$/, '\n') + block;
}

/**
 * Apply a PrisBack/LB4-style relation to prisma schema content.
 *
 * @param {string} content
 * @param {object} spec
 * @param {Array} models - parsed models (for id types)
 */
function applyRelationToSchemaContent(content, spec, models) {
  const {
    relationType: type,
    sourceModel,
    targetModel,
    relationName,
    foreignKey,
    throughModel,
    throughSourceKey,
    throughTargetKey,
  } = spec;

  const source = models.find(m => m.name === sourceModel);
  const target = models.find(m => m.name === targetModel);
  if (!source || !target) {
    throw new Error('Source and target models must exist in schema');
  }

  const sourceId = idField(source.fields);
  const targetId = idField(target.fields);
  const sourceIdType = sourceId ? sourceId.type : 'Int';
  const targetIdType = targetId ? targetId.type : 'Int';

  const relName = relationName || defaultRelationName(type, targetModel);
  const fk = foreignKey || defaultForeignKey(sourceModel);
  const targetFk = throughTargetKey || defaultForeignKey(targetModel);
  const sourceFk = throughSourceKey || fk;
  const through = throughModel || defaultThroughModel(sourceModel, targetModel);

  let next = content;

  switch (type) {
    case relationType.belongsTo: {
      // source belongsTo target → FK on source, array back-relation on target
      next = insertFieldsIntoModel(next, sourceModel, [
        `${fk} ${targetIdType}`,
        `${relName} ${targetModel} @relation(fields: [${fk}], references: [id])`,
      ]);
      const back = pluralize(camelCase(sourceModel));
      next = insertFieldsIntoModel(next, targetModel, [`${back} ${sourceModel}[]`]);
      break;
    }
    case relationType.hasMany: {
      // source hasMany target → FK on target, array on source
      next = insertFieldsIntoModel(next, sourceModel, [
        `${relName} ${targetModel}[]`,
      ]);
      next = insertFieldsIntoModel(next, targetModel, [
        `${fk} ${sourceIdType}`,
        `${camelCase(sourceModel)} ${sourceModel} @relation(fields: [${fk}], references: [id])`,
      ]);
      break;
    }
    case relationType.hasOne: {
      next = insertFieldsIntoModel(next, sourceModel, [
        `${relName} ${targetModel}?`,
      ]);
      next = insertFieldsIntoModel(next, targetModel, [
        `${fk} ${sourceIdType} @unique`,
        `${camelCase(sourceModel)} ${sourceModel} @relation(fields: [${fk}], references: [id])`,
      ]);
      break;
    }
    case relationType.hasManyThrough: {
      next = insertFieldsIntoModel(next, sourceModel, [
        `${relName} ${through}[]`,
      ]);
      next = insertFieldsIntoModel(next, targetModel, [
        `${pluralize(camelCase(sourceModel))} ${through}[]`,
      ]);
      next = ensureThroughModel(
        next,
        through,
        sourceModel,
        targetModel,
        sourceFk,
        targetFk,
        sourceIdType,
        targetIdType,
      );
      break;
    }
    case relationType.referencesMany: {
      // Implicit many-to-many (Prisma)
      next = insertFieldsIntoModel(next, sourceModel, [
        `${relName} ${targetModel}[]`,
      ]);
      next = insertFieldsIntoModel(next, targetModel, [
        `${pluralize(camelCase(sourceModel))} ${sourceModel}[]`,
      ]);
      break;
    }
    default:
      throw new Error(`Unsupported relation type: ${type}`);
  }

  return {
    content: next,
    resolved: {
      relationType: type,
      sourceModel,
      targetModel,
      relationName: relName,
      foreignKey: fk,
      throughModel: type === relationType.hasManyThrough ? through : undefined,
      throughSourceKey: type === relationType.hasManyThrough ? sourceFk : undefined,
      throughTargetKey: type === relationType.hasManyThrough ? targetFk : undefined,
      sourceIdType,
      targetIdType,
    },
  };
}

function applyRelationToSchemaFile(schemaPath, spec, models) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  const {content: next, resolved} = applyRelationToSchemaContent(
    content,
    spec,
    models,
  );
  fs.writeFileSync(schemaPath, next);
  return resolved;
}

module.exports = {
  defaultRelationName,
  defaultForeignKey,
  defaultThroughModel,
  insertFieldsIntoModel,
  applyRelationToSchemaContent,
  applyRelationToSchemaFile,
};
