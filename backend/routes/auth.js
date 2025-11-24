const { authLimiter } = require('../middleware/rateLimiter');
const config = require('../config');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const sessionStore = require('../redisSessionStore');
const validation = require('../middleware/validation');

// POST / - Verify user PIN and generate session token
router.post('/', authLimiter, validation.auth.login, async (req, res) => {
    try {
        const { pin } = req.body;
        const correctPin = config.auth.pin;
        
        // Debug logging
        console.log('PIN verification attempt:');
        console.log('  Received PIN:', pin, 'Type:', typeof pin, 'Length:', pin?.length);
        console.log('  Correct PIN:', correctPin, 'Type:', typeof correctPin, 'Length:', correctPin?.length);
        
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
            // Generate secure session token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + config.auth.sessionMaxAge;
            
            await sessionStore.create(token, {
                authenticated: true,
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

// POST /verify-token - Verify session token
router.post('/verify-token', authLimiter, validation.auth.verifyToken, async (req, res) => {
    try {
        const { token } = req.body;
        
        const session = await sessionStore.get(token);
        
        if (!session) {
            return res.status(200).json({ valid: false });
        }
        
        res.json({ 
            valid: session.authenticated,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ error: 'Failed to verify token', valid: false });
    }
});

module.exports = router;
