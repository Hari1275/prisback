'use strict';

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const {expect} = require('@prisback/testlab');
const {generateNewApp} = require('../../lib/prisback/generators/new-app');
const {serveApp} = require('../../lib/prisback/serve');
const {runPrisbackCommand} = require('../../lib/prisback');

describe('prisback new', function () {
  this.timeout(10000);
  let tmp;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prisback-new-'));
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('scaffolds a runnable starter layout', async () => {
    const result = await generateNewApp(
      {name: 'demo-api'},
      {cwd: tmp, nonInteractive: true, outdir: 'demo-api'},
    );

    expect(result.name).to.eql('demo-api');
    expect(result.className).to.eql('DemoApiApplication');

    const root = result.outDir;
    expect(await fs.pathExists(path.join(root, 'package.json'))).to.be.true();
    expect(await fs.pathExists(path.join(root, 'src/application.ts'))).to.be.true();
    expect(await fs.pathExists(path.join(root, 'src/index.ts'))).to.be.true();
    expect(
      await fs.pathExists(path.join(root, 'src/controllers/ping.controller.ts')),
    ).to.be.true();
    expect(
      await fs.pathExists(path.join(root, 'src/controllers/health.controller.ts')),
    ).to.be.true();
    expect(
      await fs.pathExists(path.join(root, 'src/config/security.ts')),
    ).to.be.true();
    expect(await fs.pathExists(path.join(root, 'prisma/schema.prisma'))).to.be.true();
    expect(await fs.pathExists(path.join(root, 'public/index.html'))).to.be.true();
    expect(
      await fs.pathExists(path.join(root, 'public/explorer/index.html')),
    ).to.be.true();
    const indexTs = await fs.readFile(path.join(root, 'src/index.ts'), 'utf8');
    expect(indexTs).to.match(/apiExplorer:\s*\{\s*disabled:\s*true/);
    expect(indexTs).to.match(/trustProxy/);

    const schema = await fs.readFile(path.join(root, 'prisma/schema.prisma'), 'utf8');
    expect(schema).to.match(/provider\s*=\s*"sqlite"/);
    expect(result.provider).to.eql('sqlite');

    const indexSrc = await fs.readFile(path.join(root, 'src/index.ts'), 'utf8');
    expect(indexSrc).to.match(/openapi\.json/);
    expect(indexSrc).to.match(/\/health/);

    const appSrc = await fs.readFile(path.join(root, 'src/application.ts'), 'utf8');
    expect(appSrc).to.match(/PrismaComponent/);
    expect(appSrc).to.match(/AuthenticationComponent/);
    expect(appSrc).to.match(/BootMixin/);
    expect(appSrc).to.match(/helmet/);
    expect(appSrc).to.match(/rateLimit/);
  });

  it('scaffolds mongodb datasource when provider is mongodb', async () => {
    const result = await generateNewApp(
      {name: 'mongo-api'},
      {cwd: tmp, nonInteractive: true, outdir: 'mongo-api', provider: 'mongodb'},
    );
    const schema = await fs.readFile(
      path.join(result.outDir, 'prisma/schema.prisma'),
      'utf8',
    );
    expect(schema).to.match(/provider\s*=\s*"mongodb"/);
    const env = await fs.readFile(path.join(result.outDir, '.env.example'), 'utf8');
    expect(env).to.match(/mongodb/);
  });

  it('runPrisbackCommand new works', async () => {
    const logs = [];
    await runPrisbackCommand(
      {
        _: ['new', 'hello'],
        cwd: tmp,
        yes: true,
        nonInteractive: true,
      },
      m => logs.push(String(m)),
    );
    expect(await fs.pathExists(path.join(tmp, 'hello', 'src/index.ts'))).to.be.true();
    expect(logs.join('\n')).to.match(/Created PrisBack app/);
  });

  it('serve dry-run reports openapi url', async () => {
    const appDir = path.join(tmp, 'svc');
    await generateNewApp(
      {name: 'svc'},
      {cwd: tmp, nonInteractive: true, outdir: 'svc'},
    );
    await fs.ensureDir(path.join(appDir, 'dist'));
    await fs.writeFile(path.join(appDir, 'dist', 'index.js'), 'console.log("hi")');
    const logs = [];
    const result = await serveApp(
      {cwd: appDir, port: 3000, dryRun: true},
      m => logs.push(String(m)),
    );
    expect(result.entry).to.match(/dist[/\\]index\.js/);
    expect(logs.join('\n')).to.match(/openapi\.json/);
  });
});
