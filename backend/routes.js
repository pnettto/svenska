const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const prompts = require('./prompts');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./database');
require('dotenv').config();

// Speech cache directory
const SPEECH_CACHE_DIR = path.join(__dirname, 'data', 'speech');

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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ============================================================================
// WORD CRUD OPERATIONS
// ============================================================================

// GET /api/words - Get all words
router.get('/words', async (req, res) => {
    try {
        const words = await db.getAllWords();
        res.json({ words, count: words.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch words' });
    }
});

// GET /api/words/:id - Get a single word by ID
router.get('/words/:id', async (req, res) => {
    try {
        const word = await db.getWordById(req.params.id);
        if (!word) return res.status(404).json({ error: 'Word not found' });
        res.json(word);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch word' });
    }
});

// POST /api/words - Create a new word
router.post('/words', async (req, res) => {
    const { original, translation, examples = [], speech = null } = req.body;
    
    if (!original || !translation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const newWord = await db.createWord(original, translation, examples, speech);
        res.status(201).json(newWord);
    } catch (error) {
        const status = error.message === 'Word already exists' ? 409 : 500;
        res.status(status).json({ error: error.message || 'Failed to create word' });
    }
});

// PUT /api/words/:id - Update an existing word
router.put('/words/:id', async (req, res) => {
    const { original, translation, examples = [], speech = null } = req.body;
    
    if (!original || !translation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const updatedWord = await db.updateWord(req.params.id, original, translation, examples, speech);
        res.json(updatedWord);
    } catch (error) {
        const status = error.message === 'Word not found' ? 404 : 500;
        res.status(status).json({ error: error.message || 'Failed to update word' });
    }
});

// PATCH /api/words/:id - Partially update a word (e.g., increment read count)
router.patch('/words/:id', async (req, res) => {
    try {
        // Handle read count increment
        if (req.body.incrementReadCount) {
            const updatedWord = await db.incrementReadCount(req.params.id);
            return res.json(updatedWord);
        }

        // Handle speech filename update
        if (req.body.speech !== undefined) {
            const word = await db.getWordById(req.params.id);
            if (!word) return res.status(404).json({ error: 'Word not found' });
            
            const updatedWord = await db.updateWord(
                req.params.id,
                word.original,
                word.translation,
                word.examples || [],
                req.body.speech
            );
            return res.json(updatedWord);
        }

        res.status(400).json({ error: 'No valid update fields provided' });
    } catch (error) {
        const status = error.message === 'Word not found' ? 404 : 500;
        res.status(status).json({ error: error.message || 'Failed to update word' });
    }
});

// DELETE /api/words/:id - Delete a word
router.delete('/words/:id', async (req, res) => {
    try {
        const deleted = await db.deleteWord(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Word not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete word' });
    }
});

// ============================================================================
// AI OPERATIONS
// ============================================================================

// POST /api/generate-examples - Generate example sentences using OpenAI
router.post('/generate-examples', async (req, res) => {
    const { swedishWord, englishTranslation, existingExamples, wordId } = req.body;
    
    if (!swedishWord || !englishTranslation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: prompts.exampleGeneration.system },
                { role: 'user', content: prompts.exampleGeneration.user(swedishWord, englishTranslation, existingExamples) }
            ],
            temperature: 0.4,
            max_tokens: 300,
            response_format: { type: "json_object" },
            store: true
        });
        
        // Parse examples from response
        const content = completion.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/) || [content];
        const examples = JSON.parse(jsonMatch[0]);
        
        // Save examples to database if wordId provided
        if (wordId) {
            const word = await db.getWordById(wordId);
            if (word) {
                const allExamples = [...(existingExamples || []), ...examples];
                await db.updateWord(wordId, word.original, word.translation, allExamples, word.speech);
            }
        }
        
        res.json({ examples });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate examples' });
    }
});

// POST /api/translate - Translate text using OpenAI
router.post('/translate', async (req, res) => {
    const { text, sourceLang = 'sv', targetLang = 'en' } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Missing required field: text' });
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: prompts.translation.system },
                { role: 'user', content: prompts.translation.user(text, sourceLang, targetLang) }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        
        res.json({ translation: completion.choices[0].message.content.trim() });
    } catch (error) {
        res.status(500).json({ error: 'Translation failed' });
    }
});

// POST /api/tts - Text-to-Speech using Azure Speech Service with caching
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

// GET /api/speech/:filename - Serve cached speech audio by filename
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

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

// GET /api/stats - Get database statistics
router.get('/stats', async (req, res) => {
    try {
        const count = await db.getWordCount();
        const limit = parseInt(req.query.limit) || 10;
        const mostViewed = await db.getMostViewedWords(limit);
        
        res.json({ 
            totalWords: count,
            mostViewedWords: mostViewed.map(w => ({
                original: w.original,
                readCount: w.read_count
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// GET /api/export - Download words as CSV
router.get('/export', async (req, res) => {
    try {
        const words = await db.getAllWords();
        
        const escapeCsv = (field) => {
            if (!field) return '';
            const str = String(field);
            return str.includes(',') || str.includes('\n') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };
        
        const maxExamples = Math.max(...words.map(w => (w.examples || []).length), 0);
        
        let csv = 'Original,Translation';
        for (let i = 1; i <= maxExamples; i++) csv += `,Swedish ${i},English ${i}`;
        csv += '\n';
        
        csv += words.map(word => {
            const row = [escapeCsv(word.original), escapeCsv(word.translation)];
            for (let i = 0; i < maxExamples; i++) {
                const ex = word.examples?.[i];
                row.push(escapeCsv(ex?.swedish), escapeCsv(ex?.english));
            }
            return row.join(',');
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="words.csv"');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate CSV' });
    }
});

module.exports = router;
