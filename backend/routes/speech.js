const express = require('express');
const router = express.Router();
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Speech cache directory
// Use /data volume on Fly.io, fallback to local path for development
const SPEECH_CACHE_DIR = process.env.FLY_APP_NAME 
    ? '/data/speech' 
    : path.join(__dirname, '..', 'data', 'speech');

// Ensure cache directory exists
if (!fs.existsSync(SPEECH_CACHE_DIR)) {
    fs.mkdirSync(SPEECH_CACHE_DIR, { recursive: true });
}

// Helper function to generate speech filename
const generateSpeechFilename = (text, voiceName = 'Astrid') => {
    const hash = crypto
        .createHash('sha256')
        .update(`${text}_${voiceName}`)
        .digest('hex');
    return `${hash}.mp3`;
};

// POST /tts - Text-to-Speech using Amazon Polly with caching
router.post('/tts', async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Missing required field: text' });
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
        return res.status(500).json({ error: 'AWS credentials not configured' });
    }
    
    try {
        const voiceName = 'Astrid'; // Swedish female voice in Polly (standard engine)
        const cacheFilename = generateSpeechFilename(text, voiceName);
        const cacheFilePath = path.join(SPEECH_CACHE_DIR, cacheFilename);
        
        // Return cached audio if exists
        if (fs.existsSync(cacheFilePath)) {
            const audioBuffer = fs.readFileSync(cacheFilePath);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Speech-File', cacheFilename);
            return res.send(audioBuffer);
        }
        
        // Generate speech via Amazon Polly
        const pollyClient = new PollyClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        
        const params = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voiceName,
            LanguageCode: 'sv-SE'
        };
        
        const command = new SynthesizeSpeechCommand(params);
        const response = await pollyClient.send(command);
        
        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of response.AudioStream) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);
        
        // Cache the audio file
        fs.writeFileSync(cacheFilePath, audioBuffer);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Speech-File', cacheFilename);
        res.send(audioBuffer);
    } catch (error) {
        console.error('Polly TTS error:', error);
        res.status(500).json({ error: 'TTS service error', details: error.message });
    }
});

// GET /speech/:filename - Serve cached speech audio by filename
router.get('/speech/:filename', (req, res) => {
    const { filename } = req.params;
    
    if (!/^[a-f0-9]{64}\.mp3$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename format' });
    }
    
    const filePath = path.join(SPEECH_CACHE_DIR, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Speech file not found' });
    }
    
    try {
        const audioBuffer = fs.readFileSync(filePath);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(audioBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read speech file' });
    }
});

module.exports = router;
