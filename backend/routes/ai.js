const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const prompts = require('../prompts');
const db = require('../database');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// POST /generate-examples - Generate example sentences using OpenAI
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

// POST /translate - Translate text using OpenAI
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

// POST /generate-random-word - Generate a random Swedish word using OpenAI
router.post('/generate-random-word', async (req, res) => {
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: prompts.randomWord.system },
                { role: 'user', content: prompts.randomWord.user() }
            ],
            temperature: 0.8,
            max_tokens: 100,
            response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate random word' });
    }
});

module.exports = router;
