/**
 * API routes for word management
 */

const express = require('express');
const router = express.Router();
const dbOperations = require('../database');

// GET /api/words - Get all words
router.get('/words', async (req, res) => {
    try {
        const words = await dbOperations.getAllWords();
        res.json({ words, count: words.length });
    } catch (error) {
        console.error('Error fetching words:', error);
        res.status(500).json({ error: 'Failed to fetch words' });
    }
});

// GET /api/words/:id - Get a single word by ID
router.get('/words/:id', async (req, res) => {
    try {
        const word = await dbOperations.getWordById(req.params.id);
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
        const newWord = await dbOperations.createWord(original, translation, examples, speech);
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
        const updatedWord = await dbOperations.updateWord(
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

// DELETE /api/words/:id - Delete a word
router.delete('/words/:id', async (req, res) => {
    try {
        const deleted = await dbOperations.deleteWord(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Word not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting word:', error);
        res.status(500).json({ error: 'Failed to delete word' });
    }
});

// POST /api/words/:id/increment-read - Increment read count for a word
router.post('/words/:id/increment-read', async (req, res) => {
    try {
        const updatedWord = await dbOperations.incrementReadCount(req.params.id);
        res.json(updatedWord);
    } catch (error) {
        console.error('Error incrementing read count:', error);
        if (error.message === 'Word not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to increment read count' });
    }
});

// PATCH /api/words/:id/speech - Update the speech filename for a word
router.patch('/words/:id/speech', async (req, res) => {
    const { speech } = req.body;
    
    if (!speech) {
        return res.status(400).json({ error: 'Missing required field: speech' });
    }
    
    try {
        const word = await dbOperations.getWordById(req.params.id);
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }
        
        const updatedWord = await dbOperations.updateWord(
            req.params.id,
            word.original,
            word.translation,
            word.examples || [],
            speech
        );
        
        res.json(updatedWord);
    } catch (error) {
        console.error('Error updating word speech:', error);
        res.status(500).json({ error: 'Failed to update word speech' });
    }
});

// PATCH /api/words/:id/examples/:index - Update a specific example's speech filename
router.patch('/words/:id/examples/:index', async (req, res) => {
    const { index } = req.params;
    const { speech } = req.body;
    
    if (!speech) {
        return res.status(400).json({ error: 'Missing required field: speech' });
    }
    
    const exampleIndex = parseInt(index);
    if (isNaN(exampleIndex) || exampleIndex < 0) {
        return res.status(400).json({ error: 'Invalid example index' });
    }
    
    try {
        const word = await dbOperations.getWordById(req.params.id);
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }
        
        if (!word.examples || exampleIndex >= word.examples.length) {
            return res.status(400).json({ error: 'Example index out of range' });
        }
        
        // Update the specific example
        const examples = [...word.examples];
        examples[exampleIndex] = {
            ...examples[exampleIndex],
            speech
        };
        
        const updatedWord = await dbOperations.updateWord(
            req.params.id,
            word.original,
            word.translation,
            examples,
            word.speech
        );
        
        res.json(updatedWord);
    } catch (error) {
        console.error('Error updating example speech:', error);
        res.status(500).json({ error: 'Failed to update example speech' });
    }
});

// GET /api/words/stats - Get database statistics
router.get('/stats', async (req, res) => {
    try {
        const count = await dbOperations.getWordCount();
        const limit = parseInt(req.query.limit) || 10;
        const mostViewed = await dbOperations.getMostViewedWords(limit);
        
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

// GET /api/words/download/csv - Download words as CSV
router.get('/export', async (req, res) => {
    try {
        const words = await dbOperations.getAllWords();
        
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
