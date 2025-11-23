const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { Redis } = require('@upstash/redis')
const config = require('../config');

// Redis-backed rate limit store
class RedisStore {
    constructor(options = {}) {
        this.prefix = options.prefix || 'rl:';
        this.client = null;
        this.windowMs = options.windowMs || 60000;
        this.initClient();
    }

    initClient() {
        try {
            this.client = new Redis({
                url: config.redis.url,
                token: config.redis.token
            });
        } catch (error) {
            console.error('Redis rate limiter connection error:', error);
        }
    }

    async increment(key) {
        if (!this.client) {
            // Fallback to in-memory if Redis unavailable
            return { totalHits: 0, resetTime: new Date(Date.now() + this.windowMs) };
        }

        const fullKey = `${this.prefix}${key}`;
        const current = await this.client.incr(fullKey);

        if (current === 1) {
            await this.client.expire(fullKey, Math.ceil(this.windowMs / 1000));
        }

        const ttl = await this.client.ttl(fullKey);
        const resetTime = new Date(Date.now() + (ttl * 1000));

        return {
            totalHits: current,
            resetTime
        };
    }

    async decrement(key) {
        if (!this.client) return;
        const fullKey = `${this.prefix}${key}`;
        await this.client.decr(fullKey);
    }

    async resetKey(key) {
        if (!this.client) return;
        const fullKey = `${this.prefix}${key}`;
        await this.client.del(fullKey);
    }
}

// Global rate limiter - applies to all API routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
    store: new RedisStore({ prefix: 'rl:global:', windowMs: 15 * 60 * 1000 })
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later',
    store: new RedisStore({ prefix: 'rl:auth:', windowMs: 15 * 60 * 1000 })
});

// AI endpoint limiter
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 90, // Limit each IP to 90 AI requests
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many AI requests, please try again later',
    store: new RedisStore({ prefix: 'rl:ai:', windowMs: 15 * 60 * 1000 })
});

// Speed limiter - slows down requests instead of blocking
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: (hits) => hits * 100,
    maxDelayMs: 20000
});

module.exports = {
    globalLimiter,
    authLimiter,
    aiLimiter,
    speedLimiter,
    RedisStore
};
