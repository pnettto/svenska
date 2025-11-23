const sessionStore = require('../redisSessionStore');
const config = require('../config');
const { createClient } = require('redis');

// Redis client for tracking IP-based rate limiting
let rateLimitClient = null;

async function initRateLimitClient() {
    if (!rateLimitClient) {
        rateLimitClient = createClient({
            url: config.redis.url
        });
        await rateLimitClient.connect();
    }
    return rateLimitClient;
}

// Track interaction count per IP in Redis
async function getInteractionCount(ip) {
    try {
        const client = await initRateLimitClient();
        const key = `interactions:${ip}`;
        const count = await client.get(key);
        return parseInt(count || '0', 10);
    } catch (error) {
        console.error('Error getting interaction count:', error);
        return 0;
    }
}

async function incrementInteractionCount(ip) {
    try {
        const client = await initRateLimitClient();
        const key = `interactions:${ip}`;
        const newCount = await client.incr(key);
        
        // Set expiry if this is the first interaction
        if (newCount === 1) {
            await client.expire(key, config.auth.rateLimitWindowMs / 1000);
        }
        
        return newCount;
    } catch (error) {
        console.error('Error incrementing interaction count:', error);
        return 0;
    }
}

// Middleware to check if request has valid session token
async function requireAuth(req, res, next) {
    const token = req.headers['x-session-token'];
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Authentication required',
            code: 'NO_TOKEN'
        });
    }
    
    try {
        const session = await sessionStore.get(token);
        
        if (!session) {
            return res.status(401).json({ 
                error: 'Invalid or expired session',
                code: 'INVALID_TOKEN'
            });
        }
        
        // Attach session to request
        req.session = session;
        next();
    } catch (error) {
        console.error('Error validating session:', error);
        return res.status(500).json({ error: 'Session validation failed' });
    }
}

// Middleware to check auth OR allow if within free interactions limit
async function requireAuthOrLimit(req, res, next) {
    const token = req.headers['x-session-token'];
    const clientIp = req.ip || req.connection.remoteAddress;
    const MAX_FREE_INTERACTIONS = config.auth.rateLimitMax;
    
    console.log('Auth Check - IP:', clientIp, 'Has Token:', !!token, 'Max Free:', MAX_FREE_INTERACTIONS);
    
    // If they have a token, it MUST be valid
    if (token) {
        try {
            const session = await sessionStore.get(token);
            if (session) {
                req.session = session;
                return next();
            }
            // Token exists but is invalid - reject
            return res.status(401).json({ 
                error: 'Invalid or expired session',
                code: 'INVALID_TOKEN'
            });
        } catch (error) {
            console.error('Error checking session:', error);
            return res.status(500).json({ error: 'Session validation failed' });
        }
    }
    
    // Check server-side interaction count by IP
    try {
        const interactionCount = await getInteractionCount(clientIp);
        
        console.log('Rate Limit Check - IP:', clientIp, 'Count:', interactionCount, 'Limit:', MAX_FREE_INTERACTIONS);
        
        // Check if they've exceeded the limit
        if (interactionCount >= MAX_FREE_INTERACTIONS) {
            console.log('Rate Limit - BLOCKED');
            return res.status(401).json({ 
                error: 'Authentication required after free interactions',
                code: 'LIMIT_EXCEEDED',
                interactionCount: interactionCount,
                maxFree: MAX_FREE_INTERACTIONS
            });
        }
        
        // Increment counter and allow request
        const newCount = await incrementInteractionCount(clientIp);
        console.log('Rate Limit - ALLOWED, new count:', newCount);
        return next();
    } catch (error) {
        console.error('Error checking rate limit:', error);
        // On error, block the request for security
        return res.status(500).json({ 
            error: 'Rate limit check failed',
            code: 'RATE_LIMIT_ERROR'
        });
    }
}

module.exports = { requireAuth, requireAuthOrLimit };
