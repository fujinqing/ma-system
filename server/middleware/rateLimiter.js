const config = require('../config');

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.max = options.max || 1000;
    this.message = options.message || '请求过于频繁，请稍后再试';
    this.requests = new Map();
    this.startCleanup();
  }

  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - this.windowMs;

      if (!this.requests.has(key)) {
        this.requests.set(key, []);
      }

      const userRequests = this.requests.get(key);
      const validRequests = userRequests.filter(time => time > windowStart);
      this.requests.set(key, validRequests);

      if (validRequests.length >= this.max) {
        const retryAfter = Math.ceil((validRequests[0] - windowStart) / 1000);
        res.set('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          message: this.message,
          retryAfter: retryAfter
        });
      }

      validRequests.push(now);
      this.requests.set(key, validRequests);
      next();
    };
  }

  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      
      for (const [key, times] of this.requests.entries()) {
        const validTimes = times.filter(time => time > windowStart);
        if (validTimes.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validTimes);
        }
      }
    }, this.windowMs);
  }

  reset(key) {
    if (key) {
      this.requests.delete(key);
    }
  }

  getStats() {
    let total = 0;
    for (const times of this.requests.values()) {
      total += times.length;
    }
    return {
      uniqueIPs: this.requests.size,
      totalRequests: total
    };
  }
}

const rateLimiter = new RateLimiter(config.rateLimit);

module.exports = {
  rateLimiter,
  RateLimiter
};
