'use strict';

const fs = require('fs-extra');
const path = require('path');

const SCALAR_TYPES = new Set([
  'String',
  'Int',
  'BigInt',
  'Float',
  'Decimal',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes',
]);

/**
 * Locate prisma/schema.prisma from cwd (walk up a few levels).
 */
function findSchemaPath(cwd = process.cwd()) {
  let dir = cwd;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'prisma', 'schema.prisma');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(cwd, 'prisma', 'schema.prisma');
}

/**
 * Parse models from a Prisma schema string.
 * @returns {{name: string, fields: Array<{name, type, isOptional, isArray, isId, isUnique, isUpdatedAt, attributes, isRelation}>}[]}
 */
function parseSchema(content) {
  const models = [];
  const modelRe = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let match;
  while ((match = modelRe.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const fields = [];
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
      const fieldMatch = line.match(
        /^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/,
      );
      if (!fieldMatch) continue;
      const [, fieldName, type, arr, optional, rest] = fieldMatch;
      const attributes = rest || '';
      const isRelation = !SCALAR_TYPES.has(type);
      fields.push({
        name: fieldName,
        type,
        isOptional: Boolean(optional),
        isArray: Boolean(arr),
        isId: /(?:^|\s)@id\b/.test(attributes),
        isUnique: /(?:^|\s)@unique\b/.test(attributes),
        isUpdatedAt: /(?:^|\s)@updatedAt\b/.test(attributes),
        hasDefault: /(?:^|\s)@default\s*\(/.test(attributes),
        attributes,
        isRelation,
      });
    }
    models.push({name, fields});
  }
  return models;
}

function readSchema(schemaPath) {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(
      `Prisma schema not found at ${schemaPath}. Create prisma/schema.prisma first.`,
    );
  }
  const content = fs.readFileSync(schemaPath, 'utf8');
  return {content, models: parseSchema(content), schemaPath};
}

function getModel(models, modelName) {
  const found = models.find(
    m => m.name.toLowerCase() === String(modelName).toLowerCase(),
  );
  if (!found) {
    const names = models.map(m => m.name).join(', ') || '(none)';
    throw new Error(`Model "${modelName}" not found in schema. Available: ${names}`);
  }
  return found;
}

/**
 * Append a model block to schema.prisma (creates file with generator/datasource if missing).
 */
function appendModel(schemaPath, modelName, fields) {
  fs.ensureDirSync(path.dirname(schemaPath));
  let content = '';
  if (fs.existsSync(schemaPath)) {
    content = fs.readFileSync(schemaPath, 'utf8');
    if (parseSchema(content).some(m => m.name === modelName)) {
      throw new Error(`Model "${modelName}" already exists in ${schemaPath}`);
    }
  } else {
    content = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

`;
  }

  const lines = fields.map(f => {
    const opt = f.isOptional ? '?' : '';
    const attrs = [];
    if (f.isId) attrs.push('@id');
    // Int + hasDefault → @default(autoincrement()) for id or any Int field
    if (f.hasDefault && f.type === 'Int') attrs.push('@default(autoincrement())');
    if (f.hasDefault && f.type === 'DateTime') attrs.push('@default(now())');
    if (f.isUpdatedAt) attrs.push('@updatedAt');
    if (f.isUnique) attrs.push('@unique');
    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `  ${f.name} ${f.type}${opt}${attrStr}`;
  });

  for (const f of fields) {
    if (f.isIndex && !f.isUnique) {
      // @@index only when not already uniquely constrained
      lines.push(`  @@index([${f.name}])`);
    }
  }

  content =
    content.replace(/\s*$/, '\n') +
    `\nmodel ${modelName} {\n${lines.join('\n')}\n}\n`;
  fs.writeFileSync(schemaPath, content);
  return schemaPath;
}

/**
 * Map Prisma scalar type → class-validator decorator names.
 */
function validatorDecoratorsForField(field) {
  if (field.isRelation) return [];
  const decorators = [];
  if (field.isOptional || field.hasDefault || field.isId || field.isUpdatedAt) {
    decorators.push('@IsOptional()');
  }
  switch (field.type) {
    case 'String':
      decorators.push('@IsString()');
      break;
    case 'Int':
    case 'BigInt':
      decorators.push('@IsInt()');
      break;
    case 'Float':
    case 'Decimal':
      decorators.push('@IsNumber()');
      break;
    case 'Boolean':
      decorators.push('@IsBoolean()');
      break;
    case 'DateTime':
      decorators.push('@IsDateString()');
      break;
    default:
      decorators.push('@IsOptional()');
  }
  return [...new Set(decorators)];
}

/**
 * Fields usable in Create DTO (exclude id autoincrement, updatedAt, relations).
 */
function createDtoFields(fields) {
  return fields.filter(
    f =>
      !f.isRelation &&
      !f.isUpdatedAt &&
      !(f.isId && f.hasDefault),
  );
}

/**
 * Fields usable in Update DTO (all create fields optional).
 */
function updateDtoFields(fields) {
  return createDtoFields(fields).map(f => ({...f, isOptional: true}));
}

function idField(fields) {
  return fields.find(f => f.isId) || fields.find(f => f.name === 'id');
}

module.exports = {
  SCALAR_TYPES,
  findSchemaPath,
  parseSchema,
  readSchema,
  getModel,
  appendModel,
  validatorDecoratorsForField,
  createDtoFields,
  updateDtoFields,
  idField,
};
