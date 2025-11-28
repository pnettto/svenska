#!/usr/bin/env node

/**
 * Migration script to convert NeDB database to LokiDB
 * This script reads all data from the existing NeDB database and imports it into a new LokiDB database
 */

const Datastore = require('@seald-io/nedb');
const loki = require('lokijs');
const path = require('path');
const fs = require('fs');

const OLD_DB_PATH = '/data/words.db';
const NEW_DB_PATH = '/data/words-loki.db';
const BACKUP_PATH = '/data/words-nedb-bkp.db';

console.log('🔄 Starting NeDB to LokiDB migration...\n');

async function migrateDatabase() {
    try {
        // Check if old database exists
        if (!fs.existsSync(OLD_DB_PATH)) {
            console.error(`❌ Old database not found at: ${OLD_DB_PATH}`);
            process.exit(1);
        }

        // Create backup of old database
        console.log('📦 Creating backup of NeDB database...');
        fs.copyFileSync(OLD_DB_PATH, BACKUP_PATH);
        console.log(`   ✅ Backup created at: ${BACKUP_PATH}\n`);

        // Read data from NeDB
        console.log('📖 Reading data from NeDB...');
        const oldDb = new Datastore({ filename: OLD_DB_PATH, autoload: true });

        const words = await new Promise((resolve, reject) => {
            oldDb.find({}, (err, docs) => {
                if (err) reject(err);
                else resolve(docs);
            });
        });

        console.log(`   Found ${words.length} words\n`);

        // Create new LokiDB database
        console.log('🔧 Creating new LokiDB database...');

        const imported = await new Promise((resolve, reject) => {
            const db = new loki(NEW_DB_PATH, {
                autoload: false,
                autosave: true,
                autosaveInterval: 4000
            });

            // Add collection
            const wordsCollection = db.addCollection('words', {
                unique: ['original'],
                indices: ['original', 'read_count']
            });

            // Insert all words
            console.log('📝 Importing words into LokiDB...');
            let imported = 0;
            let skipped = 0;
            const seenWords = new Set();

            for (const word of words) {
                try {
                    // Remove NeDB's _id field as LokiDB uses $loki
                    const { _id, ...wordData } = word;

                    // Skip duplicates
                    if (seenWords.has(wordData.original)) {
                        console.log(`   ⏭️  Skipping duplicate: "${wordData.original}"`);
                        skipped++;
                        continue;
                    }
                    seenWords.add(wordData.original);

                    // Ensure timestamps exist
                    if (!wordData.createdAt) {
                        wordData.createdAt = new Date(word.createdAt || Date.now());
                    }
                    if (!wordData.updatedAt) {
                        wordData.updatedAt = new Date(word.updatedAt || Date.now());
                    }

                    wordsCollection.insert(wordData);
                    imported++;
                } catch (error) {
                    console.error(`   ⚠️  Error importing word "${word.original}": ${error.message}`);
                    skipped++;
                }
            }

            console.log(`   ✅ Imported ${imported} words`);
            if (skipped > 0) {
                console.log(`   ⏭️  Skipped ${skipped} duplicate/error words`);
            }
            console.log();

            // Save database
            console.log('💾 Saving LokiDB database...');
            db.saveDatabase((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(imported);
                }
            });
        });

        console.log('   ✅ Database saved\n');

        // Verify migration
        console.log('🔍 Verifying migration...');
        await verifyMigration(imported);

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Test the new database with your application');
        console.log('   2. If everything works, you can delete the backup:');
        console.log(`      rm ${BACKUP_PATH}`);
        console.log('   3. Replace the old database with the new one:');
        console.log(`      mv ${NEW_DB_PATH} ${OLD_DB_PATH}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function verifyMigration(expectedCount) {
    return new Promise((resolve, reject) => {
        const db = new loki(NEW_DB_PATH, {
            autoload: true,
            autoloadCallback: () => {
                const words = db.getCollection('words');

                if (!words) {
                    reject(new Error('Words collection not found in new database'));
                    return;
                }

                const count = words.count();
                console.log(`   Expected: ${expectedCount} words`);
                console.log(`   Found: ${count} words`);

                if (count === expectedCount) {
                    console.log('   ✅ Verification successful');
                    resolve();
                } else {
                    reject(new Error(`Count mismatch: expected ${expectedCount}, found ${count}`));
                }
            }
        });
    });
}

// Run migration
migrateDatabase();
