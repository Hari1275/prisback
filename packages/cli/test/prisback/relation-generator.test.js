'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {expect} = require('@prisback/testlab');
const {RELATION_TYPE_CHOICES, relationType} = require('../../lib/prisback/relation-types');
const {
  applyRelationToSchemaContent,
  defaultRelationName,
} = require('../../lib/prisback/relation-schema');
const {parseSchema} = require('../../lib/prisback/prisma-schema');
const {generateRelation} = require('../../lib/prisback/generators/relation');
const {generateCrud} = require('../../lib/prisback/generators/crud');

describe('relation types (LB4 parity)', () => {
  it('exposes the same relationType keys as LoopBack 4', () => {
    expect(RELATION_TYPE_CHOICES).to.eql([
      'belongsTo',
      'hasMany',
      'hasManyThrough',
      'hasOne',
      'referencesMany',
    ]);
    expect(relationType.hasMany).to.eql('hasMany');
  });

  it('defaults relation names like LB4', () => {
    expect(defaultRelationName('hasMany', 'Post')).to.eql('posts');
    expect(defaultRelationName('belongsTo', 'User')).to.eql('user');
    expect(defaultRelationName('hasOne', 'Profile')).to.eql('profile');
  });
});

describe('applyRelationToSchemaContent', () => {
  const base = `
model User {
  id Int @id @default(autoincrement())
}

model Post {
  id Int @id @default(autoincrement())
  title String
}
`;

  it('wires hasMany User → Post', () => {
    const models = parseSchema(base);
    const {content, resolved} = applyRelationToSchemaContent(
      base,
      {
        relationType: 'hasMany',
        sourceModel: 'User',
        targetModel: 'Post',
        relationName: 'posts',
        foreignKey: 'userId',
      },
      models,
    );
    expect(resolved.relationName).to.eql('posts');
    expect(content).to.match(/model User \{[\s\S]*posts Post\[\]/);
    expect(content).to.match(/model Post \{[\s\S]*userId Int/);
    expect(content).to.match(/user User @relation\(fields: \[userId\]/);
  });

  it('wires belongsTo Post → User', () => {
    const models = parseSchema(base);
    const {content} = applyRelationToSchemaContent(
      base,
      {
        relationType: 'belongsTo',
        sourceModel: 'Post',
        targetModel: 'User',
        relationName: 'author',
        foreignKey: 'authorId',
      },
      models,
    );
    expect(content).to.match(/authorId Int/);
    expect(content).to.match(/author User @relation/);
    expect(content).to.match(/posts Post\[\]/);
  });

  it('wires hasOne User → Profile', () => {
    const withProfile =
      base +
      `
model Profile {
  id Int @id @default(autoincrement())
}
`;
    const models = parseSchema(withProfile);
    const {content} = applyRelationToSchemaContent(
      withProfile,
      {
        relationType: 'hasOne',
        sourceModel: 'User',
        targetModel: 'Profile',
        relationName: 'profile',
        foreignKey: 'userId',
      },
      models,
    );
    expect(content).to.match(/profile Profile\?/);
    expect(content).to.match(/userId Int @unique/);
  });

  it('wires hasManyThrough with join model', () => {
    const withCat =
      base +
      `
model Category {
  id Int @id @default(autoincrement())
  name String
}
`;
    const models = parseSchema(withCat);
    const {content, resolved} = applyRelationToSchemaContent(
      withCat,
      {
        relationType: 'hasManyThrough',
        sourceModel: 'User',
        targetModel: 'Category',
        relationName: 'categories',
      },
      models,
    );
    expect(resolved.throughModel).to.eql('UserCategories');
    expect(content).to.match(/model UserCategories/);
    expect(content).to.match(/@@id\(\[userId, categoryId\]\)/);
  });

  it('wires referencesMany as implicit m-n', () => {
    const withTag =
      base +
      `
model Tag {
  id Int @id @default(autoincrement())
  name String
}
`;
    const models = parseSchema(withTag);
    const {content} = applyRelationToSchemaContent(
      withTag,
      {
        relationType: 'referencesMany',
        sourceModel: 'Post',
        targetModel: 'Tag',
        relationName: 'tags',
      },
      models,
    );
    expect(content).to.match(/tags Tag\[\]/);
    expect(content).to.match(/posts Post\[\]/);
  });
});

describe('generateRelation', function () {
  this.timeout(10000);
  let tmp;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prisback-rel-'));
    await fs.ensureDir(path.join(tmp, 'prisma'));
    await fs.writeFile(
      path.join(tmp, 'prisma', 'schema.prisma'),
      `model User {
  id Int @id @default(autoincrement())
  email String
}

model Post {
  id Int @id @default(autoincrement())
  title String
}
`,
    );
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('updates schema and generates relation repo + controller', async () => {
    await generateCrud(
      {name: 'User'},
      {cwd: tmp, nonInteractive: true, mode: 'full'},
    );

    const result = await generateRelation(
      {},
      {
        cwd: tmp,
        nonInteractive: true,
        relationType: 'hasMany',
        sourceModel: 'User',
        targetModel: 'Post',
        generateEndpoints: true,
      },
    );

    expect(result.relationType).to.eql('hasMany');
    expect(result.files.length).to.eql(2);

    const schema = await fs.readFile(
      path.join(tmp, 'prisma/schema.prisma'),
      'utf8',
    );
    expect(schema).to.match(/posts Post\[\]/);
    expect(schema).to.match(/userId Int/);

    const controller = await fs.readFile(
      path.join(tmp, 'src/modules/user/relations/user-post.controller.ts'),
      'utf8',
    );
    expect(controller).to.match(/UserPostRelationController/);
    expect(controller).to.match(/@get\('\/\{id\}\/posts'\)/);

    const repo = await fs.readFile(
      path.join(tmp, 'src/modules/user/relations/user-post.repository.ts'),
      'utf8',
    );
    expect(repo).to.match(/findPosts/);
    expect(repo).to.match(/createPosts/);

    const mod = await fs.readFile(
      path.join(tmp, 'src/modules/user/user.module.ts'),
      'utf8',
    );
    expect(mod).to.match(/UserPostRelationController/);
    expect(result.moduleUpdated).to.eql(true);
  });
});
