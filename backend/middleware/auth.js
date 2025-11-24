const sessionStore = require('../redisSessionStore');

// Middleware to check if request has valid session token
async function requireAuth(req, res, next) {
    let token = req.headers['x-session-token'];

    // Fallback to Bearer token
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

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

module.exports = { requireAuth };
