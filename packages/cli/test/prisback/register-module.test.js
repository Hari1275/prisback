'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {expect} = require('@prisback/testlab');
const {
  registerModuleInApplication,
} = require('../../lib/prisback/register-module');

describe('registerModuleInApplication', () => {
  let tmp;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prisback-reg-'));
    await fs.ensureDir(path.join(tmp, 'src'));
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('adds import + this.component for a CRUD module', async () => {
    await fs.writeFile(
      path.join(tmp, 'src/application.ts'),
      `import {RestApplication} from '@prisback/rest';
import path from 'path';

export class App extends RestApplication {
  constructor() {
    super();
    this.component(PrismaComponent);
    this.static('/', path.join(__dirname, '../public'));
  }
}
`,
    );

    const updated = registerModuleInApplication(tmp, {
      moduleClass: 'UserModule',
      importPath: './modules/user/user.module',
      marker: 'User CRUD module',
    });
    expect(updated).to.eql(true);

    const src = await fs.readFile(path.join(tmp, 'src/application.ts'), 'utf8');
    expect(src).to.match(
      /import \{UserModule\} from '\.\/modules\/user\/user\.module';/,
    );
    expect(src).to.match(/this\.component\(UserModule\)/);
    expect(src.indexOf('UserModule')).to.be.lessThan(src.indexOf('this.static'));
  });

  it('is idempotent', async () => {
    await fs.writeFile(
      path.join(tmp, 'src/application.ts'),
      `import {UserModule} from './modules/user/user.module';
export class App {
  constructor() {
    this.component(UserModule);
    this.static('/', 'public');
  }
}
`,
    );
    expect(
      registerModuleInApplication(tmp, {
        moduleClass: 'UserModule',
        importPath: './modules/user/user.module',
      }),
    ).to.eql(false);
  });
});
