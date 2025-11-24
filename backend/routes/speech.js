const express = require('express');
const router = express.Router();
const speechService = require('../services/speechService');
const validation = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

// POST /tts - Text-to-Speech using Amazon Polly with caching
router.post('/tts', requireAuth, validation.speech.tts, async (req, res) => {
    const { text } = req.body;

    try {
        const result = await speechService.synthesize(text);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-Cache', result.cached ? 'HIT' : 'MISS');
        res.setHeader('X-Speech-File', result.filename);
        res.send(result.audio);
    } catch (error) {
        console.error('Polly TTS error:', error);
        const status = error.message === 'AWS credentials not configured' ? 500 : 500;
        res.status(status).json({ error: 'TTS service error', details: error.message });
    }
});

// GET /:filename - Serve cached speech audio by filename
router.get('/:filename', validation.speech.getFile, (req, res) => {
    const { filename } = req.params;

    if (!speechService.isCached(filename)) {
        return res.status(404).json({ error: 'Speech file not found' });
    }

    try {
        const audioBuffer = speechService.readCached(filename);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(audioBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read speech file' });
    }
});

module.exports = router;
