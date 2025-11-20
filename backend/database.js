const Datastore = require('nedb-promises');
const path = require('path');

// Initialize database
// Use mounted volume on Fly.io (/data) or local file for development
const dbPath = process.env.FLY_APP_NAME 
    ? '/data/words.db' 
    : 'data/words.db';

const db = Datastore.create({
    filename: dbPath,
    autoload: true,
    timestampData: true
});

// Database operations
const dbOperations = {
    // Get all words
    getAllWords: async () => {
        const words = await db.find({}).sort({ original: 1 });
        return words;
    },
    
    // Get a single word by ID
    getWordById: async (id) => {
        const word = await db.findOne({ _id: id });
        return word;
    },
    
    // Get a single word by original text
    getWordByOriginal: async (original) => {
        const word = await db.findOne({ original });
        return word;
    },
    
    // Create a new word
    createWord: async (original, translation, examples = [], speech = null) => {
        const existing = await db.findOne({ original });
        if (existing) {
            throw new Error('Word already exists');
        }
        
        const newWord = {
            original,
            translation,
            examples,
            read_count: 0,
            speech
        };
        
        const inserted = await db.insert(newWord);
        return inserted;
    },
    
    // Update an existing word
    updateWord: async (id, original, translation, examples, speech = null) => {
        const numAffected = await db.update(
            { _id: id },
            { 
                $set: { 
                    original, 
                    translation, 
                    examples, 
                    speech 
                } 
            }
        );
        
        if (numAffected === 0) {
            throw new Error('Word not found');
        }
        
        return dbOperations.getWordById(id);
    },
    
    // Update only the speech field for a word
    updateWordSpeech: async (id, speechFilename) => {
        const numAffected = await db.update(
            { _id: id },
            { $set: { speech: speechFilename } }
        );
        
        if (numAffected === 0) {
            throw new Error('Word not found');
        }
        
        return dbOperations.getWordById(id);
    },
    
    // Delete a word
    deleteWord: async (id) => {
        const numRemoved = await db.remove({ _id: id });
        return numRemoved > 0;
    },
    
    // Increment read count
    incrementReadCount: async (id) => {
        const numAffected = await db.update(
            { _id: id },
            { $inc: { read_count: 1 } }
        );
        
        if (numAffected === 0) {
            throw new Error('Word not found');
        }
        
        return dbOperations.getWordById(id);
    },
    
    // Get total word count
    getWordCount: async () => {
        const count = await db.count({});
        return count;
    },
    
    // Get most viewed words by read count
    getMostViewedWords: async (limit = 10) => {
        const words = await db.find({})
            .sort({ read_count: -1 })
            .limit(limit);
        return words;
    },
    
    // Import words from CSV data
    importFromCSV: async (csvData) => {
        let imported = 0;
        let skipped = 0;
        
        for (const [original, translation] of csvData) {
            try {
                const existing = await db.findOne({ original });
                if (existing) {
                    skipped++;
                } else {
                    await db.insert({
                        original,
                        translation,
                        examples: [],
                        read_count: 0,
                        speech: null
                    });
                    imported++;
                }
            } catch (error) {
                throw error;
            }
        }
        
        return { imported, skipped };
    }
};

module.exports = dbOperations;
