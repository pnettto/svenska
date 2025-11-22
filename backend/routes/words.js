const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

// GET /words - Get all words
router.get('/words', async (req, res) => {
    try {
        const words = await db.getAllWords();
        res.json({ words, count: words.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch words' });
    }
});

// GET /words/:id - Get a single word by ID
router.get('/words/:id', async (req, res) => {
    try {
        const word = await db.getWordById(req.params.id);
        if (!word) return res.status(404).json({ error: 'Word not found' });
        res.json(word);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch word' });
    }
});

// POST /words - Create a new word
router.post('/words', requireAuth, async (req, res) => {
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

// PUT /words/:id - Update an existing word
router.put('/words/:id', requireAuth, async (req, res) => {
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

// PATCH /words/:id - Partially update a word
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

// DELETE /words/:id - Delete a word
router.delete('/words/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await db.deleteWord(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Word not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete word' });
    }
});

module.exports = router;
