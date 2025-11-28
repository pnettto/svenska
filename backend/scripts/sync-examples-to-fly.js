#!/usr/bin/env node

/**
 * Script to sync examples from local database to Fly.io remote database
 * Only syncs examples for words that exist in both databases (matched by 'original' field)
 */

const loki = require('lokijs');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Local database path
const localDbPath = path.join(__dirname, '../data/words.db');

function loadLokiDB(dbPath) {
    return new Promise((resolve, reject) => {
        const db = new loki(dbPath, {
            autoload: true,
            autoloadCallback: () => {
                const words = db.getCollection('words');
                if (!words) {
                    reject(new Error('Words collection not found'));
                } else {
                    resolve(words.chain().find({}).data());
                }
            }
        });
    });
}

async function getLocalWords() {
    console.log('📖 Reading local database...');
    const words = await loadLokiDB(localDbPath);
    console.log(`   Found ${words.length} words locally`);
    return words;
}

async function getRemoteWords() {
    console.log('🌐 Fetching remote words from Fly.io...');
    try {
        // Use fly ssh console to read the remote database
        const command = `fly ssh console -a svenska-new-tab-backend -C "cat /data/words.db"`;
        const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

        // Save remote db temporarily
        const tempPath = path.join(__dirname, '../data/remote-words-temp.db');
        fs.writeFileSync(tempPath, output);

        const words = await loadLokiDB(tempPath);
        console.log(`   Found ${words.length} words remotely`);

        // Clean up temp file
        fs.unlinkSync(tempPath);

        return words;
    } catch (error) {
        console.error('❌ Error fetching remote words:', error.message);
        throw error;
    }
}

async function syncExamples() {
    try {
        // Get local and remote words
        const localWords = await getLocalWords();
        const remoteWords = await getRemoteWords();

        // Create a map of remote words by original field
        const remoteWordsMap = new Map();
        remoteWords.forEach(word => {
            remoteWordsMap.set(word.original, word);
        });

        // Find matching words with examples to sync
        const wordsToSync = [];

        for (const localWord of localWords) {
            const remoteWord = remoteWordsMap.get(localWord.original);

            if (remoteWord && localWord.examples && localWord.examples.length > 0) {
                // Check if examples are different
                const localExamples = JSON.stringify(localWord.examples);
                const remoteExamples = JSON.stringify(remoteWord.examples || []);

                if (localExamples !== remoteExamples) {
                    wordsToSync.push({
                        original: localWord.original,
                        $loki: remoteWord.$loki,
                        examples: localWord.examples,
                        currentRemoteExamples: remoteWord.examples || []
                    });
                }
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   - Total local words: ${localWords.length}`);
        console.log(`   - Total remote words: ${remoteWords.length}`);
        console.log(`   - Words to sync: ${wordsToSync.length}`);

        if (wordsToSync.length === 0) {
            console.log('\n✅ All examples are already in sync!');
            return;
        }

        console.log('\n📝 Words that will be updated:');
        wordsToSync.forEach((word, index) => {
            console.log(`   ${index + 1}. "${word.original}"`);
            console.log(`      Current remote examples: ${word.currentRemoteExamples.length}`);
            console.log(`      New examples: ${word.examples.length}`);
        });

        // Generate update script
        console.log('\n🔧 Generating update script...');
        const updateScript = generateUpdateScript(wordsToSync);

        const scriptPath = path.join(__dirname, '../data/update-remote-examples.js');
        fs.writeFileSync(scriptPath, updateScript);

        console.log(`\n✅ Update script saved to: ${scriptPath}`);
        console.log('\n📤 To apply the changes, run:');
        console.log(`   fly ssh console -a svenska-new-tab-backend`);
        console.log(`   Then in the console:`);
        console.log(`   node -e "$(cat <<'EOF'\n${updateScript}\nEOF\n)"`);
        console.log('\n   Or copy the script to the remote server and run it there.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

function generateUpdateScript(wordsToSync) {
    const updates = wordsToSync.map(word => ({
        $loki: word.$loki,
        original: word.original,
        examples: word.examples
    }));

    return `
const loki = require('lokijs');

function loadDB() {
    return new Promise((resolve, reject) => {
        const db = new loki('/data/words.db', {
            autoload: true,
            autoloadCallback: () => {
                const words = db.getCollection('words');
                if (!words) {
                    reject(new Error('Words collection not found'));
                } else {
                    resolve({ db, words });
                }
            }
        });
    });
}

const updates = ${JSON.stringify(updates, null, 2)};

(async () => {
    console.log('Updating ${wordsToSync.length} words...');
    
    const { db, words } = await loadDB();
    
    for (const update of updates) {
        try {
            const word = words.findOne({ $loki: update.$loki });
            if (word) {
                word.examples = update.examples;
                word.updatedAt = new Date();
                words.update(word);
                console.log(\`✅ Updated "\${update.original}" (\${update.examples.length} examples)\`);
            } else {
                console.error(\`❌ Word not found: "\${update.original}"\`);
            }
        } catch (error) {
            console.error(\`❌ Error updating "\${update.original}":\`, error.message);
        }
    }
    
    // Save database
    await new Promise((resolve, reject) => {
        db.saveDatabase((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    
    console.log('\\n✅ Sync complete!');
})();
`.trim();
}

// Run the sync
syncExamples();
