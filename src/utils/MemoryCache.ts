interface CacheContent<K, T> {
  id: K;
  value: T;
}

const MAX_CACHE_LENGTH = 100;

class MemoryCache<K, T> {
  private caches: CacheContent<K, T>[];

  constructor() {
    this.caches = [];
  }

  add(id: K, value: T) {
    this.caches.push({ id, value });

    if (this.caches.length > MAX_CACHE_LENGTH) this.caches.shift();
  }

  get(id: K) {
    return this.caches.find((cache) => cache.id === id);
  }

  clear() {
    this.caches = [];
  }
}

export default MemoryCache;
