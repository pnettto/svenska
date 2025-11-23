const express = require('express');
const router = express.Router();
const prompts = require('../prompts');
const db = require('../database');
const { requireAuthOrLimit } = require('../middleware/auth');
const { chatCompletion } = require('../libs/chatCompletion');
require('dotenv').config();

// POST /generate-examples - Generate example sentences using AI
router.post('/generate-examples', requireAuthOrLimit, async (req, res) => {
    const { swedishWord, englishTranslation, existingExamples, wordId } = req.body;
    
    if (!swedishWord || !englishTranslation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const response = await chatCompletion({
            messages: [
                { role: 'system', content: prompts.exampleGeneration.system },
                { role: 'user', content: prompts.exampleGeneration.user(swedishWord, englishTranslation, existingExamples) }
            ],
            temperature: 0.4,
            max_tokens: 300,
            response_format: { type: "json_object" }
        });
        
        // Parse examples from response
        const content = response.content;
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
        console.error('Generate examples error:', error);
        res.status(500).json({ error: 'Failed to generate examples' });
    }
});

// POST /translate - Translate text using AI
router.post('/translate', requireAuthOrLimit, async (req, res) => {
    const { text, sourceLang = 'sv', targetLang = 'en' } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Missing required field: text' });
    
    try {
        const response = await chatCompletion({
            messages: [
                { role: 'system', content: prompts.translation.system },
                { role: 'user', content: prompts.translation.user(text, sourceLang, targetLang) }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        
        res.json({ translation: response.content.trim() });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// POST /generate-random-word - Generate a random Swedish word using AI
router.post('/generate-random-word', requireAuthOrLimit, async (req, res) => {
    try {
        const response = await chatCompletion({
            messages: [
                { role: 'system', content: prompts.randomWord.system },
                { role: 'user', content: prompts.randomWord.user() }
            ],
            temperature: 0.8,
            max_tokens: 100,
            response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(response.content);
        res.json(result);
    } catch (error) {
        console.error('Generate random word error:', error);
        res.status(500).json({ error: 'Failed to generate random word' });
    }
});

module.exports = router;
