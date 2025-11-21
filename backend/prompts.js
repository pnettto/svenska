/**
 * AI prompts configuration for Swedish language learning
 */

const prompts = {
    exampleGeneration: {
        system: 'You are a Swedish language teacher. Generate simple, practical example sentences at A2-B1 level (beginner to intermediate) that demonstrate how to use Swedish words in everyday contexts.',
        
        user: (swedishWord, englishTranslation, existingExamples) => {
            let prompt = `Generate 3 example sentences using the Swedish word "${swedishWord}" (meaning "${englishTranslation}").`;
            
            if (existingExamples?.length > 0) {
                prompt += `\n\nThese examples ALREADY EXIST - generate NEW and DIFFERENT ones:\n${existingExamples.map((ex, i) => `${i + 1}. ${ex.swedish}`).join('\n')}`;
                prompt += `\n\nYour new examples must use different contexts, sentence structures, and complexity levels.`;
            }
            
            return prompt + `\n\nReturn a JSON array: [{"swedish": "...", "english": "..."}, ...]\nMake sentences natural and practical.`;
        }
    },
    
    translation: {
        system: 'You are a professional translator. Return ONLY the translated text without explanations or notes.',
        user: (text, sourceLang, targetLang) => `Translate from ${sourceLang} to ${targetLang}:\n\n${text}`
    },
    
    randomWord: {
        system: 'You are a Swedish language teacher with a vast vocabulary. Generate diverse, unpredictable Swedish words or expressions for intermediate learners. Vary between different word types, topics, and difficulty levels. Never repeat recent words.',
        user: () => {
            const categories = ['food', 'nature', 'emotions', 'actions', 'objects', 'time', 'people', 'places', 'qualities', 'weather', 'body', 'colors', 'animals', 'transportation', 'home', 'work', 'hobbies', 'relationships'];
            const wordTypes = ['noun', 'verb', 'adjective', 'adverb', 'expression'];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomType = wordTypes[Math.floor(Math.random() * wordTypes.length)];
            const timestamp = Date.now();
            
            return `Generate ONE random Swedish ${randomType} related to "${randomCategory}". Make it practical and useful. Seed: ${timestamp}. Return as JSON: {"swedish": "...", "english": "..."}`;
        }
    }
};

module.exports = prompts;
