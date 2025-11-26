const rateLimit = require('express-rate-limit');
const config = require('../config');

const passDevServer = () => {
    if (config.isProduction) {
        return false;
    }

    // In development, bypass rate limiting by calling next middleware immediately
    return (req, res, next) => {
        // By pass rate limiter for development server
        next();
    };
};

// Global rate limiter - applies to all API routes
const globalLimiter = passDevServer() || rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
    // Default store is MemoryStore, which is what we want now
});

// Strict limiter for auth endpoints
const authLimiter = passDevServer() || rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth attempts
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later',
});

// AI endpoint limiter
const aiLimiter = passDevServer() || rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 90, // Limit each IP to 90 AI requests
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many AI requests, please try again later',
});

module.exports = {
    globalLimiter,
    authLimiter,
    aiLimiter
};
