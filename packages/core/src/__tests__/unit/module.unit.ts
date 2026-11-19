import {expect} from '@prisback/testlab';
import {Application} from '../../application';
import {Component} from '../../component';
import {
  getModuleMetadata,
  Module,
  moduleToComponent,
} from '../../module';

describe('@Module()', () => {
  class FooController {}
  class FooService {}
  class FooRepository {}

  @Module({
    controllers: [FooController],
    providers: [FooService],
    repositories: [FooRepository],
  })
  class FooModule {}

  @Module({
    imports: [FooModule],
    controllers: [],
  })
  class AppModule {}

  @Module({
    controllers: [FooController],
    providers: [FooRepository], // legacy: repo listed as provider
  })
  class LegacyRepoModule {}

  it('stores module metadata', () => {
    const meta = getModuleMetadata(FooModule);
    expect(meta).to.containDeep({
      controllers: [FooController],
      providers: [FooService],
      repositories: [FooRepository],
    });
  });

  it('exposes Component shape on the prototype', () => {
    const instance = new FooModule() as Component;
    expect(instance.controllers).to.eql([FooController]);
    expect(instance.services).to.eql([FooService]);
    expect(instance.repositories).to.eql([FooRepository]);
    expect(instance.components).to.eql([]);
  });

  it('maps imports to nested components', () => {
    const instance = new AppModule() as Component;
    expect(instance.components).to.eql([FooModule]);
  });

  it('moduleToComponent returns a Component object', () => {
    const component = moduleToComponent(FooModule);
    expect(component).to.containDeep({
      controllers: [FooController],
      services: [FooService],
      repositories: [FooRepository],
    });
  });

  it('mounts via app.component()', () => {
    const app = new Application();
    const binding = app.component(FooModule);
    expect(binding.key).to.match(/FooModule/);

    const controllers = app.find('controllers.*');
    expect(controllers.length).to.be.greaterThan(0);
  });

  it('binds repositories as repositories.ClassName', async () => {
    const app = new Application();
    app.component(FooModule);
    expect(app.isBound('repositories.FooRepository')).to.eql(true);
    const repo = await app.get('repositories.FooRepository');
    expect(repo).to.be.instanceOf(FooRepository);
  });

  it('mirrors *Repository providers under repositories.*', async () => {
    const app = new Application();
    app.component(LegacyRepoModule);
    expect(app.isBound('services.FooRepository')).to.eql(true);
    expect(app.isBound('repositories.FooRepository')).to.eql(true);
    const repo = await app.get('repositories.FooRepository');
    expect(repo).to.be.instanceOf(FooRepository);
  });
});
