const express = require('express');
const router = express.Router();
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Speech cache directory
const SPEECH_CACHE_DIR = path.join(__dirname, '..', 'data', 'speech');

// Ensure cache directory exists
if (!fs.existsSync(SPEECH_CACHE_DIR)) {
    fs.mkdirSync(SPEECH_CACHE_DIR, { recursive: true });
}

// Helper function to generate speech filename
const generateSpeechFilename = (text, voiceName = 'sv-SE-SofieNeural') => {
    const hash = crypto
        .createHash('sha256')
        .update(`${text}_${voiceName}`)
        .digest('hex');
    return `${hash}.mp3`;
};

// POST /tts - Text-to-Speech using Azure Speech Service with caching
router.post('/tts', async (req, res) => {
    const { text } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Missing required field: text' });
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
        return res.status(500).json({ error: 'Azure Speech credentials not configured' });
    }
    
    try {
        const voiceName = 'sv-SE-SofieNeural';
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
        
        // Generate speech via Azure
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_SPEECH_REGION
        );
        
        speechConfig.speechSynthesisVoiceName = voiceName;
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
        
        synthesizer.speakTextAsync(
            text,
            result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    const audioBuffer = Buffer.from(result.audioData);
                    fs.writeFileSync(cacheFilePath, audioBuffer);
                    
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.setHeader('X-Cache', 'MISS');
                    res.setHeader('X-Speech-File', cacheFilename);
                    res.send(audioBuffer);
                } else {
                    res.status(500).json({ error: 'Speech synthesis failed' });
                }
                synthesizer.close();
            },
            error => {
                res.status(500).json({ error: 'Speech synthesis error' });
                synthesizer.close();
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'TTS service error' });
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
