const express = require('express');
const router = express.Router();
const wordService = require('../services/wordService');
const { requireAuth } = require('../middleware/auth');

// GET /stats - Get database statistics
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const count = await wordService.getWordCount();
        const limit = parseInt(req.query.limit) || 10;
        const mostViewed = await wordService.getMostViewedWords(limit);
        
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

// GET /export - Download words as CSV
router.get('/export', requireAuth, async (req, res) => {
    try {
        const words = await wordService.getAllWords();
        
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
