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
        console.error('Error fetching words:', error);
        res.status(500).json({ error: 'Failed to fetch words' });
    }
});

// GET /api/words/:id - Get a single word by ID
router.get('/words/:id', async (req, res) => {
    try {
        const word = await db.getWordById(req.params.id);
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }
        res.json(word);
    } catch (error) {
        console.error('Error fetching word:', error);
        res.status(500).json({ error: 'Failed to fetch word' });
    }
});

// POST /api/words - Create a new word
router.post('/words', async (req, res) => {
    const { original, translation, examples = [], speech = null } = req.body;
    
    if (!original || !translation) {
        return res.status(400).json({ 
            error: 'Missing required fields: original and translation are required' 
        });
    }
    
    try {
        const newWord = await db.createWord(original, translation, examples, speech);
        res.status(201).json(newWord);
    } catch (error) {
        console.error('Error creating word:', error);
        if (error.message === 'Word already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create word' });
    }
});

// PUT /api/words/:id - Update an existing word
router.put('/words/:id', async (req, res) => {
    const { original, translation, examples, speech = null } = req.body;
    
    if (!original || !translation) {
        return res.status(400).json({ 
            error: 'Missing required fields: original and translation are required' 
        });
    }
    
    try {
        const updatedWord = await db.updateWord(
            req.params.id,
            original,
            translation,
            examples || [],
            speech
        );
        res.json(updatedWord);
    } catch (error) {
        console.error('Error updating word:', error);
        if (error.message === 'Word not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update word' });
    }
});

// PATCH /api/words/:id - Partially update a word (e.g., increment read count)
router.patch('/words/:id', async (req, res) => {
    try {
        const word = await db.getWordById(req.params.id);
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }

        // Handle read count increment
        if (req.body.incrementReadCount) {
            const updatedWord = await db.incrementReadCount(req.params.id);
            return res.json(updatedWord);
        }

        // Handle speech filename update
        if (req.body.speech !== undefined) {
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
        console.error('Error updating word:', error);
        res.status(500).json({ error: 'Failed to update word' });
    }
});

// DELETE /api/words/:id - Delete a word
router.delete('/words/:id', async (req, res) => {
    try {
        const deleted = await db.deleteWord(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Word not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting word:', error);
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
                {
                    role: 'system',
                    content: prompts.exampleGeneration.system
                },
                {
                    role: 'user',
                    content: prompts.exampleGeneration.user(swedishWord, englishTranslation, existingExamples)
                }
            ],
            temperature: 0.4,
            max_tokens: 300,
            response_format: { type: "json_object" },
            store: true
        });
        
        const content = completion.choices[0].message.content;
        
        // Parse the JSON response
        let examples;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                examples = JSON.parse(jsonMatch[0]);
            } else {
                examples = JSON.parse(content);
            }
        } catch (parseError) {
            console.error('Error parsing OpenAI response:', parseError);
            return res.status(500).json({ 
                error: 'Failed to parse examples from OpenAI response' 
            });
        }
        
        // If wordId provided, save examples to the database
        if (wordId) {
            try {
                const word = await db.getWordById(wordId);
                if (word) {
                    const allExamples = [...(existingExamples || []), ...examples];
                    await db.updateWord(
                        wordId,
                        word.original,
                        word.translation,
                        allExamples,
                        word.speech
                    );
                    console.log(`Saved ${examples.length} new examples to word ID ${wordId}`);
                }
            } catch (dbError) {
                console.error('Error saving examples to database:', dbError);
                // Still return the examples even if DB update fails
            }
        }
        
        res.json({ examples });
        
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/translate - Translate text using OpenAI
router.post('/translate', async (req, res) => {
    const { text, sourceLang = 'sv', targetLang = 'en' } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Missing required field: text' });
    }
    
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: prompts.translation.system
                },
                {
                    role: 'user',
                    content: prompts.translation.user(text, sourceLang, targetLang)
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        
        const translation = completion.choices[0].message.content.trim();
        
        res.json({ translation });
        
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/tts - Text-to-Speech using Azure Speech Service with caching
router.post('/tts', async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Missing required field: text' });
    }
    
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
        return res.status(500).json({ error: 'Azure Speech credentials not configured' });
    }
    
    try {
        // Generate cache filename from text hash
        const voiceName = 'sv-SE-SofieNeural';
        const cacheFilename = generateSpeechFilename(text, voiceName);
        const cacheFilePath = path.join(SPEECH_CACHE_DIR, cacheFilename);
        
        // Check if cached audio exists
        if (fs.existsSync(cacheFilePath)) {
            console.log(`Cache hit for text: "${text.substring(0, 30)}..."`);
            const audioBuffer = fs.readFileSync(cacheFilePath);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Speech-File', cacheFilename);
            return res.send(audioBuffer);
        }
        
        console.log(`Cache miss for text: "${text.substring(0, 30)}..." - calling Azure Speech API`);
        
        // Cache miss - generate speech via Azure
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_SPEECH_REGION
        );
        
        speechConfig.speechSynthesisVoiceName = voiceName;
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
        
        synthesizer.speakTextAsync(
            text,
            async result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    const audioBuffer = Buffer.from(result.audioData);
                    
                    // Save to cache
                    fs.writeFileSync(cacheFilePath, audioBuffer);
                    console.log(`Cached audio for: "${text.substring(0, 30)}..."`);
                    
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.setHeader('X-Cache', 'MISS');
                    res.setHeader('X-Speech-File', cacheFilename);
                    res.send(audioBuffer);
                } else {
                    console.error('Speech synthesis failed:', result.errorDetails);
                    res.status(500).json({ error: 'Speech synthesis failed', details: result.errorDetails });
                }
                synthesizer.close();
            },
            error => {
                console.error('Error during speech synthesis:', error);
                res.status(500).json({ error: 'Internal server error' });
                synthesizer.close();
            }
        );
        
    } catch (error) {
        console.error('Error in TTS endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/speech/:filename - Serve cached speech audio by filename
router.get('/speech/:filename', (req, res) => {
    const { filename } = req.params;
    
    // Validate filename format (hash.mp3)
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
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.send(audioBuffer);
    } catch (error) {
        console.error('Error reading speech file:', error);
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
            mostViewedWords: mostViewed.map(word => ({
                original: word.original,
                readCount: word.read_count
            }))
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// GET /api/export - Download words as CSV
router.get('/export', async (req, res) => {
    try {
        const words = await db.getAllWords();
        
        // Helper function to escape CSV fields
        const escapeCsvField = (field) => {
            if (field === null || field === undefined) return '';
            const str = String(field);
            // Escape double quotes and wrap in quotes if contains comma, newline, or quote
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        // Find the maximum number of examples across all words
        const maxExamples = Math.max(...words.map(word => (word.examples || []).length), 0);
        
        // Build CSV header with dynamic example columns
        let csvHeader = 'Original,Translation';
        for (let i = 1; i <= maxExamples; i++) {
            csvHeader += `,Swedish ${i},English ${i}`;
        }
        csvHeader += '\n';
        
        // Build CSV rows
        const csvRows = words.map(word => {
            const row = [
                escapeCsvField(word.original),
                escapeCsvField(word.translation)
            ];
            
            // Add example columns
            for (let i = 0; i < maxExamples; i++) {
                if (word.examples && word.examples[i]) {
                    row.push(escapeCsvField(word.examples[i].swedish));
                    row.push(escapeCsvField(word.examples[i].english));
                } else {
                    row.push('');
                    row.push('');
                }
            }
            
            return row.join(',');
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="words.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).json({ error: 'Failed to generate CSV' });
    }
});

module.exports = router;
