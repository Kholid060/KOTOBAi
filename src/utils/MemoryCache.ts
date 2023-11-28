interface CacheContent<T> {
  value: T;
  id: string;
}

const MAX_CACHE_LENGTH = 100;

class MemoryCache<T> {
  private caches: CacheContent<T>[];

  constructor() {
    this.caches = [];
  }

  add(id: string, value: T) {
    this.caches.push({ id, value });

    if (this.caches.length > MAX_CACHE_LENGTH) this.caches.shift();
  }

  get(id: string) {
    return this.caches.find((cache) => cache.id === id);
  }

  clear() {
    this.caches = [];
  }
}

export default MemoryCache;
