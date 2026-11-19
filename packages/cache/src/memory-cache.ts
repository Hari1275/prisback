export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * In-process cache for single-node / tests. Prefer Redis via CacheService
 * for multi-instance production.
 */
export class MemoryCacheStore implements CacheStore {
  private readonly map = new Map<string, {value: string; expiresAt?: number}>();

  async get(key: string): Promise<string | null> {
    const row = this.map.get(key);
    if (!row) return null;
    if (row.expiresAt != null && Date.now() > row.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return row.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.map.set(key, {
      value,
      expiresAt:
        ttlSeconds != null ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}
