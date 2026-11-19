import {Application, BindingScope, inject} from '@prisback/core';
import {expect, sinon} from '@prisback/testlab';
import {
  injectPrisma,
  PrismaBindings,
  PrismaClientLike,
  PrismaComponent,
  PrismaService,
} from '../..';

describe('PrismaService', () => {
  let connect: sinon.SinonStub;
  let disconnect: sinon.SinonStub;
  let client: PrismaClientLike;

  beforeEach(() => {
    connect = sinon.stub().resolves();
    disconnect = sinon.stub().resolves();
    client = {
      $connect: connect,
      $disconnect: disconnect,
    };
  });

  it('calls $connect on init and $disconnect on stop', async () => {
    const service = new PrismaService(client);
    await service.init();
    sinon.assert.calledOnce(connect);
    await service.stop();
    sinon.assert.calledOnce(disconnect);
  });

  it('exposes the bound client', () => {
    const service = new PrismaService(client);
    expect(service.client).to.equal(client);
  });

  it('reports readiness via $queryRaw when available', async () => {
    const queryRaw = sinon.stub().resolves([{ok: 1}]);
    const readyClient: PrismaClientLike = {
      $connect: connect,
      $disconnect: disconnect,
      $queryRaw: queryRaw,
    };
    const service = new PrismaService(readyClient);
    expect(await service.isReady()).to.eql(true);
    sinon.assert.calledOnce(queryRaw);
  });

  it('returns false when readiness probe fails', async () => {
    const readyClient: PrismaClientLike = {
      $connect: connect,
      $disconnect: disconnect,
      $queryRaw: sinon.stub().rejects(new Error('down')),
    };
    const service = new PrismaService(readyClient);
    expect(await service.isReady()).to.eql(false);
  });
});

describe('PrismaComponent', () => {
  let connect: sinon.SinonStub;
  let disconnect: sinon.SinonStub;
  let client: PrismaClientLike;

  beforeEach(() => {
    connect = sinon.stub().resolves();
    disconnect = sinon.stub().resolves();
    client = {
      $connect: connect,
      $disconnect: disconnect,
    };
  });

  it('registers PrismaService and runs lifecycle with the app', async () => {
    const app = new Application();
    app.bind(PrismaBindings.CLIENT).to(client).inScope(BindingScope.SINGLETON);
    app.component(PrismaComponent);

    await app.init();
    sinon.assert.calledOnce(connect);

    const service = await app.get<PrismaService>(PrismaBindings.PRISMA_SERVICE);
    expect(service).to.be.instanceOf(PrismaService);
    expect(service.client).to.equal(client);

    await app.stop();
    sinon.assert.calledOnce(disconnect);
  });

  it('injects PrismaService via @injectPrisma()', async () => {
    const app = new Application();
    app.bind(PrismaBindings.CLIENT).to(client).inScope(BindingScope.SINGLETON);
    app.component(PrismaComponent);

    class DemoRepo {
      constructor(@injectPrisma() public prisma: PrismaService) {}
    }

    app.bind('repos.DemoRepo').toClass(DemoRepo);
    const repo = await app.get<DemoRepo>('repos.DemoRepo');
    expect(repo.prisma).to.be.instanceOf(PrismaService);
    expect(repo.prisma.client).to.equal(client);
  });

  it('supports constructor @inject of PRISMA_SERVICE key', async () => {
    const app = new Application();
    app.bind(PrismaBindings.CLIENT).to(client).inScope(BindingScope.SINGLETON);
    app.component(PrismaComponent);

    class DemoService {
      constructor(
        @inject(PrismaBindings.PRISMA_SERVICE) public prisma: PrismaService,
      ) {}
    }

    app.bind('services.Demo').toClass(DemoService);
    const svc = await app.get<DemoService>('services.Demo');
    expect(svc.prisma.client).to.equal(client);
  });
});
