const wordService = require('../services/wordService');
const speechService = require('../services/speechService');
const path = require('path');

async function migrate() {
    console.log('Starting migration of speech files...');

    try {
        // Ensure database is initialized
        await wordService._ensureInitialized();

        const words = wordService.words.find({});
        console.log(`Found ${words.length} words to check.`);

        let updatedCount = 0;
        let speechFoundCount = 0;

        for (const word of words) {
            let changed = false;

            // 1. Check word speech
            if (!word.speech) {
                const filename = speechService.generateFilename(word.original);
                if (speechService.isCached(filename)) {
                    word.speech = filename;
                    changed = true;
                    speechFoundCount++;
                    console.log(`[Word] Linked speech for "${word.original}"`);
                }
            }

            // 2. Check examples speech
            if (word.examples && Array.isArray(word.examples)) {
                for (const example of word.examples) {
                    if (!example.speech && example.swedish) {
                        const filename = speechService.generateFilename(example.swedish);
                        if (speechService.isCached(filename)) {
                            example.speech = filename;
                            changed = true;
                            speechFoundCount++;
                            // console.log(`[Example] Linked speech for example in "${word.original}"`);
                        }
                    }
                }
            }

            if (changed) {
                word.updatedAt = new Date();
                wordService.words.update(word);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(`Saving database with ${updatedCount} updated words...`);
            await wordService._saveDatabase();
            console.log('Database saved successfully.');
        } else {
            console.log('No updates needed.');
        }

        console.log(`Migration complete. Updated ${updatedCount} words. Linked ${speechFoundCount} speech files.`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
