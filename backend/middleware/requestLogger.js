const MASK_LENGTH = 6;

function maskToken(token = '') {
    if (token.length <= MASK_LENGTH * 2) {
        return token;
    }
    const start = token.slice(0, MASK_LENGTH);
    const end = token.slice(-MASK_LENGTH);
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

