class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 300;
    this.checkPeriod = 60;
    this.startCleanup();
  }

  set(key, value, ttl = this.ttl) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, this.checkPeriod * 1000);
  }

  size() {
    return this.cache.size;
  }
}

const cache = new MemoryCache();

module.exports = {
  cache,
  MemoryCache
};
