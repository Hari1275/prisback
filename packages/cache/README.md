# `@prisback/cache`

Optional cache helpers for high-traffic PrisBack apps.

```ts
import {CacheService, MemoryCacheStore} from '@prisback/cache';

const cache = new CacheService({store: new MemoryCacheStore(), defaultTtlSeconds: 60});

const users = await cache.wrap('users:list', () => repo.find({limit: 50}), 30);
```

For multi-instance production, implement `CacheStore` with Redis (`ioredis`) and bind it into `CacheService`.
