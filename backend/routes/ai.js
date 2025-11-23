const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const wordService = require('../services/wordService');
const { requireAuthOrLimit } = require('../middleware/auth');

// POST /generate-examples - Generate example sentences using AI
router.post('/generate-examples', requireAuthOrLimit, async (req, res) => {
    const { swedishWord, englishTranslation, existingExamples, wordId } = req.body;
    
    if (!swedishWord || !englishTranslation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const examples = await aiService.generateExamples(swedishWord, englishTranslation, existingExamples);
        
        // Save examples to database if wordId provided
        if (wordId) {
            const word = await wordService.getWordById(wordId);
            if (word) {
                const allExamples = [...(existingExamples || []), ...examples];
                await wordService.updateWord(wordId, word.original, word.translation, allExamples, word.speech);
            }
        }
        
        res.json({ examples });
    } catch (error) {
        console.error('Generate examples error:', error);
        res.status(500).json({ error: 'Failed to generate examples' });
    }
});

// POST /translate - Translate text using AI
router.post('/translate', requireAuthOrLimit, async (req, res) => {
    const { text, sourceLang = 'sv', targetLang = 'en' } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Missing required field: text' });
    
    try {
        const translation = await aiService.translate(text, sourceLang, targetLang);
        res.json({ translation });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// POST /generate-random-word - Generate a random Swedish word using AI
router.post('/generate-random-word', requireAuthOrLimit, async (req, res) => {
    try {
        const result = await aiService.generateRandomWord();
        res.json(result);
    } catch (error) {
        console.error('Generate random word error:', error);
        res.status(500).json({ error: 'Failed to generate random word' });
    }
});

module.exports = router;
