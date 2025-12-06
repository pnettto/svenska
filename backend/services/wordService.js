const loki = require('lokijs');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const speechService = require('./speechService');

class WordService {
    constructor() {
        this.db = null;
        this.words = null;
        this.initialized = false;
        this.initPromise = this._initialize();
    }

    _initialize() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const dbDir = path.dirname(config.database.path);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new loki(config.database.path, {
                autoload: true,
                autoloadCallback: () => {
                    this.words = this.db.getCollection('words');
                    if (!this.words) {
                        this.words = this.db.addCollection('words', {
                            unique: ['original'],
                            indices: ['original', 'read_count']
                        });
                    }

                    this.initialized = true;
                    resolve();
                },
                autosave: true,
                autosaveInterval: 4000
            });
        });
    }

    async _ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
    }

    _saveDatabase() {
        return new Promise((resolve, reject) => {
            this.db.saveDatabase((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    _addId(doc) {
        if (doc && doc.$loki) {
            doc._id = doc.$loki;
        }
        return doc;
    }

    _addIds(docs) {
        return docs.map(doc => this._addId(doc));
    }

    async getAllWords() {
        await this._ensureInitialized();
        const results = this.words.chain()
            .find({})
            .simplesort('original')
            .data();

        return this._addIds(results);
    }

    async getWordById(id) {
        await this._ensureInitialized();
        return this._addId(this.words.findOne({ $loki: parseInt(id) }));
    }

    async _ensureSpeechForExamples(examples) {
        if (!examples || !Array.isArray(examples)) return [];

        const processedExamples = [];
        for (const example of examples) {
            const processed = { ...example };
            if (!processed.speech && processed.swedish) {
                try {
                    const result = await speechService.synthesize(processed.swedish);
                    processed.speech = result.filename;
                } catch (error) {
                    console.error(`[WordService] Failed to generate speech for example "${processed.swedish}":`, error);
                }
            }
            processedExamples.push(processed);
        }
        return processedExamples;
    }

    async createWord(original, translation, examples = [], speech = null) {
        await this._ensureInitialized();

        const existing = this.words.findOne({ original });
        if (existing) {
            throw new Error('Word already exists');
        }

        // Generate speech for the word if not provided
        let speechFilename = speech;
        if (!speechFilename) {
            try {
                const result = await speechService.synthesize(original);
                speechFilename = result.filename;
            } catch (error) {
                console.error(`[WordService] Failed to generate speech for word "${original}":`, error);
            }
        }

        // Generate speech for examples
        const processedExamples = await this._ensureSpeechForExamples(examples);

        const doc = this.words.insert({
            original,
            translation,
            examples: processedExamples,
            read_count: 0,
            speech: speechFilename,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await this._saveDatabase();

        return this._addId(doc);
    }

    async updateWord(id, original, translation, examples, speech = null) {
        await this._ensureInitialized();

        console.log('[WordService] updateWord called with ID:', id, 'examples count:', examples?.length);

        const word = this.words.findOne({ $loki: parseInt(id) });

        if (!word) {
            throw new Error('Word not found');
        }

        // Store old original for comparison
        const oldOriginal = word.original;
        word.original = original;
        word.translation = translation;

        // Regenerate speech if word text changed
        if (speech) {
            word.speech = speech;
        } else if (original !== oldOriginal) {
            // Word text changed, regenerate speech
            try {
                const result = await speechService.synthesize(original);
                word.speech = result.filename;
            } catch (error) {
                console.error(`[WordService] Failed to generate speech for word "${original}":`, error);
            }
        } else if (!word.speech) {
            // Generate if missing
            try {
                const result = await speechService.synthesize(original);
                word.speech = result.filename;
            } catch (error) {
                console.error(`[WordService] Failed to generate speech for word "${original}":`, error);
            }
        }

        // Generate speech for examples
        word.examples = await this._ensureSpeechForExamples(examples);

        word.updatedAt = new Date();

        this.words.update(word);
        console.log('[WordService] Calling saveDatabase...');
        await this._saveDatabase();
        console.log('[WordService] Database saved successfully');

        return this._addId(word);
    }

    async deleteWord(id) {
        await this._ensureInitialized();

        const word = this.words.findOne({ $loki: parseInt(id) });

        if (!word) {
            return false;
        }

        this.words.remove(word);
        await this._saveDatabase();
        return true;
    }

    async incrementReadCount(id) {
        await this._ensureInitialized();

        const word = this.words.findOne({ $loki: parseInt(id) });

        if (!word) {
            throw new Error('Word not found');
        }

        word.read_count = (word.read_count || 0) + 1;
        word.updatedAt = new Date();

        this.words.update(word);
        await this._saveDatabase();

        return this._addId(word);
    }

    async getWordCount() {
        await this._ensureInitialized();
        return this.words.count();
    }

    async getMostViewedWords(limit = 10) {
        await this._ensureInitialized();

        const results = this.words.chain()
            .find({})
            .simplesort('read_count', { desc: true })
            .limit(limit)
            .data();

        return this._addIds(results);
    }
}

module.exports = new WordService();
