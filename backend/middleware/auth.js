const { verifyToken } = require('../libs/token');

function extractToken(req) {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice('Bearer '.length).trim();
}

function validateToken(token) {
    const payload = verifyToken(token);
    if (!payload || !payload.expiresAt || payload.expiresAt < Date.now()) {
        return null;
    }
    return {
        token,
        expiresAt: payload.expiresAt
    };
}

// Middleware to check if request has valid bearer token
async function requireAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_TOKEN'
            });
        }

        const validSession = validateToken(token);
        if (!validSession) {
            return res.status(401).json({
                error: 'Session expired',
                code: 'INVALID_TOKEN'
            });
        }

        req.user = validSession;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireAuth, extractToken };
