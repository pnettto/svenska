// Middleware to check if request has valid session token
async function requireAuth(req, res, next) {
    // Iron Session automatically decrypts the cookie and populates req.session
    if (!req.session.user || !req.session.user.authenticated) {
        return res.status(401).json({
            error: 'Authentication required',
            code: 'NO_TOKEN'
        });
    }

    // Check expiration (optional, as iron-session handles TTL, but good for custom logic)
    if (req.session.user.expiresAt && req.session.user.expiresAt < Date.now()) {
        req.session.destroy();
        return res.status(401).json({
            error: 'Session expired',
            code: 'INVALID_TOKEN'
        });
    }

    next();
}

module.exports = { requireAuth };
