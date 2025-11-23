const Datastore = require('nedb-promises');
const config = require('../config');

class WordService {
    constructor() {
        this.db = Datastore.create({
            filename: config.database.path,
            autoload: true,
            timestampData: true
        });
    }

    async getAllWords() {
        return await this.db.find({}).sort({ original: 1 });
    }

    async getWordById(id) {
        return await this.db.findOne({ _id: id });
    }

    async createWord(original, translation, examples = [], speech = null) {
        const existing = await this.db.findOne({ original });
        if (existing) {
            throw new Error('Word already exists');
        }

        return await this.db.insert({
            original,
            translation,
            examples,
            read_count: 0,
            speech
        });
    }

    async updateWord(id, original, translation, examples, speech = null) {
        const numAffected = await this.db.update(
            { _id: id },
            { $set: { original, translation, examples, speech } }
        );

        if (numAffected === 0) {
            throw new Error('Word not found');
        }

        return await this.db.findOne({ _id: id });
    }

    async deleteWord(id) {
        const numRemoved = await this.db.remove({ _id: id });
        return numRemoved > 0;
    }

    async incrementReadCount(id) {
        const numAffected = await this.db.update(
            { _id: id },
            { $inc: { read_count: 1 } }
        );

        if (numAffected === 0) {
            throw new Error('Word not found');
        }

        return await this.db.findOne({ _id: id });
    }

    async getWordCount() {
        return await this.db.count({});
    }

    async getMostViewedWords(limit = 10) {
        return await this.db.find({})
            .sort({ read_count: -1 })
            .limit(limit);
    }
}

module.exports = new WordService();
