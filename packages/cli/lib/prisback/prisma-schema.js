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

/** Prisma datasource providers we scaffold / detect */
const DATABASE_PROVIDERS = [
  {value: 'sqlite', title: 'SQLite (file)'},
  {value: 'postgresql', title: 'PostgreSQL'},
  {value: 'mysql', title: 'MySQL'},
  {value: 'mongodb', title: 'MongoDB'},
];

function isMongoProvider(provider) {
  return String(provider || '').toLowerCase() === 'mongodb';
}

/**
 * Read `provider = "..."` from datasource block.
 */
function parseDatasourceProvider(content) {
  if (!content) return 'sqlite';
  const m = content.match(
    /datasource\s+\w+\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/,
  );
  return (m && m[1]) || 'sqlite';
}

function readDatasourceProvider(schemaPath) {
  if (!fs.existsSync(schemaPath)) return 'sqlite';
  return parseDatasourceProvider(fs.readFileSync(schemaPath, 'utf8'));
}

/**
 * Default primary key for a provider (one id only).
 * MongoDB requires String @id @default(auto()) @map("_id") @db.ObjectId
 * SQL uses Int @id @default(autoincrement())
 */
function defaultIdField(provider = 'sqlite') {
  if (isMongoProvider(provider)) {
    return {
      name: 'id',
      type: 'String',
      isId: true,
      hasDefault: true,
      defaultFn: 'auto',
      map: '_id',
      nativeType: 'ObjectId',
      isOptional: false,
      isUpdatedAt: false,
      isUnique: false,
    };
  }
  return {
    name: 'id',
    type: 'Int',
    isId: true,
    hasDefault: true,
    isOptional: false,
    isUpdatedAt: false,
    isUnique: false,
  };
}

function schemaPreamble(provider = 'sqlite') {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

`;
}

function envExampleForProvider(provider = 'sqlite') {
  const p = String(provider || 'sqlite').toLowerCase();
  const urls = {
    sqlite: 'file:./dev.db',
    postgresql: 'postgresql://USER:PASSWORD@localhost:5432/mydb?schema=public',
    mysql: 'mysql://USER:PASSWORD@localhost:3306/mydb',
    mongodb:
      'mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/mydb?retryWrites=true&w=majority',
  };
  const databaseUrl = urls[p] || urls.sqlite;
  return `PORT=3000
HOST=127.0.0.1
DATABASE_URL="${databaseUrl}"
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1h
`;
}

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
 * Render one Prisma field line (provider-aware defaults / Mongo @map).
 */
function formatFieldLine(f, provider = 'sqlite') {
  const mongo = isMongoProvider(provider);
  const opt = f.isOptional ? '?' : '';
  const attrs = [];
  if (f.isId) attrs.push('@id');

  if (f.defaultFn === 'auto' || (f.isId && f.hasDefault && mongo && f.type === 'String')) {
    attrs.push('@default(auto())');
  } else if (f.hasDefault && f.type === 'Int' && !mongo) {
    attrs.push('@default(autoincrement())');
  } else if (f.hasDefault && f.type === 'DateTime') {
    attrs.push('@default(now())');
  } else if (f.defaultFn === 'uuid') {
    attrs.push('@default(uuid())');
  } else if (f.defaultFn === 'cuid') {
    attrs.push('@default(cuid())');
  }

  if (f.isUpdatedAt) attrs.push('@updatedAt');
  if (f.isUnique) attrs.push('@unique');
  if (f.map) attrs.push(`@map("${f.map}")`);
  if (f.nativeType) attrs.push(`@db.${f.nativeType}`);

  // Mongo PK must map to _id
  if (f.isId && mongo && !f.map && f.name === 'id') {
    if (!attrs.some(a => a.startsWith('@map('))) attrs.push('@map("_id")');
    if (f.type === 'String' && !attrs.some(a => a.startsWith('@db.'))) {
      attrs.push('@db.ObjectId');
    }
  }

  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
  return `  ${f.name} ${f.type}${opt}${attrStr}`;
}

/**
 * Append a model block to schema.prisma (creates file with generator/datasource if missing).
 * Uses datasource provider so MongoDB gets ObjectId ids (not Int autoincrement).
 */
function appendModel(schemaPath, modelName, fields, opts = {}) {
  fs.ensureDirSync(path.dirname(schemaPath));
  let content = '';
  let provider = opts.provider;
  if (fs.existsSync(schemaPath)) {
    content = fs.readFileSync(schemaPath, 'utf8');
    if (parseSchema(content).some(m => m.name === modelName)) {
      throw new Error(`Model "${modelName}" already exists in ${schemaPath}`);
    }
    provider = provider || parseDatasourceProvider(content);
  } else {
    provider = provider || 'sqlite';
    content = schemaPreamble(provider);
  }

  // Normalize a lone Int autoincrement id → Mongo ObjectId when provider is mongodb
  const normalized = fields.map(f => {
    if (
      isMongoProvider(provider) &&
      f.isId &&
      f.name === 'id' &&
      f.type === 'Int'
    ) {
      return defaultIdField('mongodb');
    }
    return f;
  });

  const lines = normalized.map(f => formatFieldLine(f, provider));

  for (const f of normalized) {
    if (f.isIndex && !f.isUnique) {
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
  DATABASE_PROVIDERS,
  isMongoProvider,
  parseDatasourceProvider,
  readDatasourceProvider,
  defaultIdField,
  schemaPreamble,
  envExampleForProvider,
  formatFieldLine,
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
