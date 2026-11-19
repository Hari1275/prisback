import {BindingKey} from '@prisback/core';
import {CacheService} from './cache.service';

export namespace CacheBindings {
  export const CACHE_SERVICE = BindingKey.create<CacheService>(
    'prisback.cache.service',
  );
}
