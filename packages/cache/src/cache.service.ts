import {BindingScope, injectable} from '@prisback/core';
import {CacheStore, MemoryCacheStore} from './memory-cache';

export interface CacheServiceOptions {
  store?: CacheStore;
  /** Default TTL seconds for JSON helpers. */
  defaultTtlSeconds?: number;
}

@injectable({scope: BindingScope.SINGLETON})
export class CacheService {
  private readonly store: CacheStore;
  private readonly defaultTtlSeconds: number;

  constructor(options: CacheServiceOptions = {}) {
    this.store = options.store ?? new MemoryCacheStore();
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 60;
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.store.set(
      key,
      value,
      ttlSeconds ?? this.defaultTtlSeconds,
    );
  }

  async del(key: string): Promise<void> {
    return this.store.del(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Cache-aside helper for read-heavy endpoints.
   */
  async wrap<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const hit = await this.getJson<T>(key);
    if (hit != null) return hit;
    const value = await loader();
    await this.setJson(key, value, ttlSeconds);
    return value;
  }
}
