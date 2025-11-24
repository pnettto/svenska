const { verifyToken } = require('../libs/token');

function extractToken(req) {
    const headerToken = req.header('x-session-token');
    const authHeader = req.header('authorization');

    if (headerToken) {
        return headerToken;
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return null;
}

async function rehydrateSessionFromToken(req) {
    const token = extractToken(req);
    if (!token) {
        return null;
    }

    const payload = verifyToken(token);
    if (!payload || payload.expiresAt < Date.now()) {
        return null;
    }

    req.session.user = {
        authenticated: true,
        expiresAt: payload.expiresAt,
        token
    };
    await req.session.save();
    return req.session.user;
}

// Middleware to check if request has valid session token
async function requireAuth(req, res, next) {
    try {
        if (!req.session.user || !req.session.user.authenticated) {
            await rehydrateSessionFromToken(req);
        }

        if (!req.session.user || !req.session.user.authenticated) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_TOKEN'
            });
        }

        if (req.session.user.expiresAt && req.session.user.expiresAt < Date.now()) {
            await req.session.destroy();
            return res.status(401).json({
                error: 'Session expired',
                code: 'INVALID_TOKEN'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireAuth };
