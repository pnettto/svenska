const sessionStore = require('../sessionStore');
const config = require('../config');

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
    const interactionCount = parseInt(req.headers['x-interaction-count'] || '0', 10);
    const MAX_FREE_INTERACTIONS = config.auth.rateLimitMax;
    
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
    
    // No token - check if they're within free limit
    if (interactionCount < MAX_FREE_INTERACTIONS) {
        return next();
    }
    
    // Exceeded limit and no valid token
    return res.status(401).json({ 
        error: 'Authentication required after free interactions',
        code: 'LIMIT_EXCEEDED'
    });
}

module.exports = { requireAuth, requireAuthOrLimit };
