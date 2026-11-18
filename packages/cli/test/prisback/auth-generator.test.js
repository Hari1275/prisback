'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {expect} = require('@prisback/testlab');
const {generateAuth} = require('../../lib/prisback/generators/auth');

describe('prisback auth generator', function () {
  this.timeout(10000);
  let tmp;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prisback-auth-'));
    await fs.writeJson(path.join(tmp, 'package.json'), {
      name: 'demo',
      dependencies: {},
    });
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('creates User model + auth module with login/register/me', async () => {
    const result = await generateAuth(
      {},
      {
        cwd: tmp,
        nonInteractive: true,
        userModel: 'User',
        register: true,
        strategy: 'jwt',
      },
    );

    expect(result.strategy).to.eql('jwt');
    expect(result.includeRegister).to.eql(true);
    expect(result.schemaResult.created).to.eql(true);

    const schema = await fs.readFile(
      path.join(tmp, 'prisma/schema.prisma'),
      'utf8',
    );
    expect(schema).to.match(/model User/);
    expect(schema).to.match(/email String @unique/);
    expect(schema).to.match(/password String/);

    const controller = await fs.readFile(
      path.join(tmp, 'src/modules/auth/auth.controller.ts'),
      'utf8',
    );
    expect(controller).to.match(/@post\('\/login'\)/);
    expect(controller).to.match(/@post\('\/register'\)/);
    expect(controller).to.match(/@authenticate\('jwt'\)/);
    expect(controller).to.match(/@get\('\/me'\)/);

    const service = await fs.readFile(
      path.join(tmp, 'src/modules/auth/auth.service.ts'),
      'utf8',
    );
    expect(service).to.match(/generateToken/);
    expect(service).to.match(/hashPassword/);

    expect(await fs.pathExists(path.join(tmp, '.env.example'))).to.be.true();
    expect(result.packageUpdated).to.eql(true);
  });

  it('can skip register endpoint', async () => {
    await generateAuth(
      {},
      {
        cwd: tmp,
        nonInteractive: true,
        userModel: 'User',
        register: false,
      },
    );
    const controller = await fs.readFile(
      path.join(tmp, 'src/modules/auth/auth.controller.ts'),
      'utf8',
    );
    expect(controller).to.match(/login/);
    expect(controller).to.not.match(/@post\('\/register'\)/);
  });
});
