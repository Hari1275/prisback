import {expect} from '@prisback/testlab';
import {CacheService} from '../../cache.service';
import {MemoryCacheStore} from '../../memory-cache';

describe('CacheService', () => {
  it('stores and loads JSON via memory store', async () => {
    const cache = new CacheService({
      store: new MemoryCacheStore(),
      defaultTtlSeconds: 30,
    });
    await cache.setJson('users:1', {id: 1, name: 'Ada'});
    expect(await cache.getJson('users:1')).to.eql({id: 1, name: 'Ada'});
    await cache.del('users:1');
    expect(await cache.getJson('users:1')).to.eql(null);
  });

  it('wrap loads once on miss', async () => {
    const cache = new CacheService({store: new MemoryCacheStore()});
    let calls = 0;
    const v1 = await cache.wrap('k', async () => {
      calls += 1;
      return {n: calls};
    });
    const v2 = await cache.wrap('k', async () => {
      calls += 1;
      return {n: calls};
    });
    expect(v1).to.eql({n: 1});
    expect(v2).to.eql({n: 1});
    expect(calls).to.eql(1);
  });
});
