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

  it('appendModel writes unique, index, and autoincrement', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisback-schema-'));
    const schemaPath = path.join(dir, 'prisma', 'schema.prisma');
    appendModel(schemaPath, 'Product', [
      {name: 'id', type: 'Int', isId: true, hasDefault: true, isOptional: false},
      {name: 'sku', type: 'String', isUnique: true, isOptional: false},
      {name: 'code', type: 'Int', hasDefault: true, isOptional: false},
      {name: 'category', type: 'String', isIndex: true, isOptional: true},
    ]);
    const content = fs.readFileSync(schemaPath, 'utf8');
    expect(content).to.match(/id\s+Int\s+@id\s+@default\(autoincrement\(\)\)/);
    expect(content).to.match(/sku\s+String\s+@unique/);
    expect(content).to.match(/code\s+Int\s+@default\(autoincrement\(\)\)/);
    expect(content).to.match(/@@index\(\[category\]\)/);
    fs.removeSync(dir);
  });
});
