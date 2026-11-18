'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {expect} = require('@prisback/testlab');
const {generateCrud} = require('../../lib/prisback/generators/crud');
const {generateModel} = require('../../lib/prisback/generators/model');
const {runPrisbackCommand} = require('../../lib/prisback');

describe('prisback crud generator', function () {
  this.timeout(10000);
  let tmp;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prisback-cli-'));
    await fs.ensureDir(path.join(tmp, 'prisma'));
    await fs.writeFile(
      path.join(tmp, 'prisma', 'schema.prisma'),
      `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`,
    );
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('generates full CRUD module files', async () => {
    const result = await generateCrud(
      {name: 'User'},
      {cwd: tmp, nonInteractive: true, mode: 'full'},
    );
    expect(result.empty).to.eql(false);
    expect(result.files).to.have.length(4);

    const dto = await fs.readFile(
      path.join(tmp, 'src/modules/user/user.dto.ts'),
      'utf8',
    );
    expect(dto).to.match(/export class CreateUserDto/);
    expect(dto).to.match(/@IsEmail|@IsString/);
    expect(dto).to.match(/export class UpdateUserDto/);
    expect(dto).to.match(/@IsOptional/);

    const repo = await fs.readFile(
      path.join(tmp, 'src/modules/user/user.repository.ts'),
      'utf8',
    );
    expect(repo).to.match(/injectPrisma/);
    expect(repo).to.match(/findAll/);
    expect(repo).to.match(/create/);

    const controller = await fs.readFile(
      path.join(tmp, 'src/modules/user/user.controller.ts'),
      'utf8',
    );
    expect(controller).to.match(/@post/);
    expect(controller).to.match(/CreateUserDto/);

    const mod = await fs.readFile(
      path.join(tmp, 'src/modules/user/user.module.ts'),
      'utf8',
    );
    expect(mod).to.match(/@Module/);
    expect(mod).to.match(/UserController/);
    expect(mod).to.match(/UserRepository/);
  });

  it('generates empty CRUD scaffold', async () => {
    const result = await generateCrud(
      {name: 'User'},
      {cwd: tmp, nonInteractive: true, empty: true, mode: 'empty'},
    );
    expect(result.empty).to.eql(true);
    const controller = await fs.readFile(
      path.join(tmp, 'src/modules/user/user.controller.ts'),
      'utf8',
    );
    expect(controller).to.match(/ping/);
    expect(controller).to.not.match(/@post\('\/'\)/);
  });

  it('appends model via generateModel', async () => {
    await generateModel(
      {name: 'Product'},
      {
        cwd: tmp,
        nonInteractive: true,
        fields: [
          {name: 'id', type: 'Int', isId: true, hasDefault: true, isOptional: false},
          {name: 'title', type: 'String', isOptional: false},
        ],
      },
    );
    const schema = await fs.readFile(
      path.join(tmp, 'prisma/schema.prisma'),
      'utf8',
    );
    expect(schema).to.match(/model Product/);
    expect(schema).to.match(/title String/);
  });

  it('runPrisbackCommand handles g crud', async () => {
    const logs = [];
    await runPrisbackCommand(
      {
        _: ['g', 'crud', 'User'],
        empty: false,
        cwd: tmp,
        yes: true,
        nonInteractive: true,
      },
      msg => logs.push(String(msg)),
    );
    expect(await fs.pathExists(path.join(tmp, 'src/modules/user/user.module.ts'))).to
      .be.true();
    expect(logs.join('\n')).to.match(/Generated crud/);
  });
});
