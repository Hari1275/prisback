'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const {expect} = require('@prisback/testlab');
const {
  parseSchema,
  getModel,
  createDtoFields,
  validatorDecoratorsForField,
  appendModel,
  defaultIdField,
  parseDatasourceProvider,
  schemaPreamble,
} = require('../../lib/prisback/prisma-schema');

const SAMPLE = `
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id     Int    @id @default(autoincrement())
  title  String
  userId Int
  user   User   @relation(fields: [userId], references: [id])
}
`;

describe('prisma-schema parser', () => {
  it('parses models and fields', () => {
    const models = parseSchema(SAMPLE);
    expect(models.map(m => m.name)).to.eql(['User', 'Post']);
    const user = getModel(models, 'User');
    expect(user.fields.find(f => f.name === 'email')).to.containDeep({
      type: 'String',
      isUnique: true,
      isOptional: false,
    });
    expect(user.fields.find(f => f.name === 'name').isOptional).to.eql(true);
    expect(user.fields.find(f => f.name === 'posts').isRelation).to.eql(true);
  });

  it('createDtoFields excludes id defaults, updatedAt, relations', () => {
    const user = getModel(parseSchema(SAMPLE), 'user');
    const fields = createDtoFields(user.fields).map(f => f.name);
    expect(fields).to.eql(['email', 'name', 'createdAt']);
  });

  it('maps validators for prisma types', () => {
    expect(validatorDecoratorsForField({type: 'String', isOptional: false})).to.eql([
      '@IsString()',
    ]);
    expect(validatorDecoratorsForField({type: 'Int', isOptional: true})).to.eql([
      '@IsOptional()',
      '@IsInt()',
    ]);
    expect(
      validatorDecoratorsForField({type: 'DateTime', isOptional: false}),
    ).to.eql(['@IsDateString()']);
  });

  it('appendModel writes default id autoincrement plus unique and index', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisback-schema-'));
    const schemaPath = path.join(dir, 'prisma', 'schema.prisma');
    appendModel(schemaPath, 'Product', [
      {name: 'id', type: 'Int', isId: true, hasDefault: true, isOptional: false},
      {name: 'sku', type: 'String', isUnique: true, isOptional: false},
      {name: 'category', type: 'String', isIndex: true, isOptional: true},
    ]);
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).to.match(/id\s+Int\s+@id\s+@default\(autoincrement\(\)\)/);
    expect(content).to.match(/sku\s+String\s+@unique/);
    expect(content).to.match(/@@index\(\[category\]\)/);
    // only one field declaration named id (not counting @id attribute)
    expect(content.match(/^\s+id\s+/gm).length).to.eql(1);
    fs.removeSync(dir);
  });

  it('SQL providers use Int autoincrement ids', () => {
    for (const provider of ['sqlite', 'postgresql', 'mysql']) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisback-schema-'));
      const schemaPath = path.join(dir, 'prisma', 'schema.prisma');
      fs.ensureDirSync(path.dirname(schemaPath));
      fs.writeFileSync(schemaPath, schemaPreamble(provider));
      appendModel(schemaPath, 'Item', [defaultIdField(provider)], {provider});
      const content = fs.readFileSync(schemaPath, 'utf8');
      expect(content).to.match(new RegExp(`provider\\s*=\\s*"${provider}"`));
      expect(content).to.match(
        /id\s+Int\s+@id\s+@default\(autoincrement\(\)\)/,
      );
      expect(content).to.not.match(/@map\("_id"\)/);
      fs.removeSync(dir);
    }
  });

  it('appendModel uses Mongo ObjectId id when provider is mongodb', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisback-schema-'));
    const schemaPath = path.join(dir, 'prisma', 'schema.prisma');
    fs.ensureDirSync(path.dirname(schemaPath));
    fs.writeFileSync(schemaPath, schemaPreamble('mongodb'));
    expect(parseDatasourceProvider(fs.readFileSync(schemaPath, 'utf8'))).to.eql(
      'mongodb',
    );
    appendModel(schemaPath, 'User', [
      defaultIdField('mongodb'),
      {name: 'email', type: 'String', isUnique: true, isOptional: false},
    ]);
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).to.match(
      /id\s+String\s+@id\s+@default\(auto\(\)\)\s+@map\("_id"\)\s+@db\.ObjectId/,
    );
    expect(content).to.not.match(/autoincrement/);
    // Int id input is normalized for mongodb
    appendModel(
      schemaPath,
      'Post',
      [
        {name: 'id', type: 'Int', isId: true, hasDefault: true, isOptional: false},
        {name: 'name', type: 'String', isOptional: false},
      ],
      {provider: 'mongodb'},
    );
    const post = fs.readFileSync(schemaPath, 'utf8');
    expect(post).to.match(
      /model Post \{\n\s+id String @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/,
    );
    fs.removeSync(dir);
  });
});
