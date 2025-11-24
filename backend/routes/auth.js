const { authLimiter } = require('../middleware/rateLimiter');
const config = require('../config');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const validation = require('../middleware/validation');
const { generateToken, verifyToken } = require('../libs/token');
const { extractToken } = require('../middleware/auth');

// POST / - Verify user PIN and generate session token
router.post('/', authLimiter, validation.auth.login, async (req, res) => {
    try {
        const { pin } = req.body;
        const correctPin = config.auth.pin;

        if (!correctPin) {
            return res.status(500).json({ error: 'PIN not configured on server' });
        }

        // Security: Use constant-time comparison to prevent timing attacks
        const pinBuffer = Buffer.from(pin);
        const correctPinBuffer = Buffer.from(correctPin);

        // Ensure buffers are same length for timing-safe comparison
        let isValid = false;
        if (pinBuffer.length === correctPinBuffer.length) {
            isValid = crypto.timingSafeEqual(pinBuffer, correctPinBuffer);
        }

        if (isValid) {
            const expiresAt = Date.now() + config.auth.sessionMaxAge;
            // Generate signed session token (stateless)
            const token = generateToken({
                nonce: crypto.randomBytes(16).toString('hex'),
                expiresAt
            });

            res.json({
                valid: true,
                token,
                expiresAt
            });
        } else {
            // Add small delay to prevent timing attacks on invalid attempts
            await new Promise(resolve => setTimeout(resolve, 100));
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        res.status(500).json({ error: 'Failed to verify PIN' });
    }
});

// POST /verify-token - Verify bearer token
router.post('/verify-token', authLimiter, async (req, res) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(200).json({ valid: false });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.expiresAt || payload.expiresAt < Date.now()) {
            return res.status(200).json({ valid: false });
        }

        res.json({
            valid: true,
            expiresAt: payload.expiresAt
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ error: 'Failed to verify token', valid: false });
    }
});

module.exports = router;
