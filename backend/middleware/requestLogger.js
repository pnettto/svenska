const config = require('../config');

function maskToken(token = '') {
    const maskLength = 6;
    const start = token.slice(0, maskLength);
    const end = token.slice(-maskLength);
    return `${start}...${end}`;
}

function formatUser(user) {
    if (!user) {
        return null;
    }

    return {
        token: maskToken(user.token),
        expiresAt: user.expiresAt ? new Date(user.expiresAt).toISOString() : null
    };
}

function requestLogger(req, res, next) {
    if (!config.isProduction) {
        // By pass request logger for development server
        return next();
    }

    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const userDetails = formatUser(req.user);
        const ip =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.ip ||
            req.socket?.remoteAddress;

        const logPayload = {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            ip,
            origin: req.headers.origin || null,
            user: userDetails
        };

        console.log('[API Request]', JSON.stringify(logPayload));
    });

    next();
}

module.exports = requestLogger;

