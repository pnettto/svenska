const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sessionStore = require('../sessionStore');

const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

// POST /verify-pin - Verify user PIN and generate session token
router.post('/verify-pin', async (req, res) => {
    try {
        const { pin } = req.body;
        const correctPin = process.env.PIN;
        
        if (!correctPin) {
            return res.status(500).json({ error: 'PIN not configured on server' });
        }
        
        if (!pin) {
            return res.status(400).json({ error: 'PIN is required' });
        }
        
        const isValid = pin === correctPin;
        
        if (isValid) {
            // Generate secure session token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + SESSION_EXPIRY;
            
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
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        res.status(500).json({ error: 'Failed to verify PIN' });
    }
});

// POST /verify-token - Verify session token
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ valid: false });
        }
        
        const session = await sessionStore.get(token);
        
        if (!session) {
            return res.json({ valid: false });
        }
        
        res.json({ 
            valid: session.authenticated,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ error: 'Failed to verify token' });
    }
});

module.exports = router;
