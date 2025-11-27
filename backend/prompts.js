/**
 * AI prompts configuration for Swedish language learning
 */

const prompts = {
    exampleGeneration: {
        system: 'You are a native Swedish speaker helping a friend learn Swedish. Create natural, conversational example sentences that sound like real everyday speech - the kind of things people actually say to family, friends, coworkers, or in casual situations. Avoid formal or textbook-style language.',

        user: (swedishWord, englishTranslation, existingExamples) => {
            let prompt = `Generate 3 example sentences using the Swedish word "${swedishWord}" (meaning "${englishTranslation}").\n\nMake them sound like natural, casual conversation - the kind of things you'd actually hear people say in daily life:`;
            prompt += `\n- At home with family`;
            prompt += `\n- Chatting with friends`;
            prompt += `\n- Casual moments at work`;
            prompt += `\n- Everyday situations\n`;
            prompt += `\nUse contractions, casual expressions, and natural phrasing. Avoid stiff, formal, or overly literary language.`;

            if (existingExamples?.length > 0) {
                prompt += `\n\nThese examples ALREADY EXIST - generate NEW and DIFFERENT ones:\n${existingExamples.map((ex, i) => `${i + 1}. ${ex.swedish}`).join('\n')}`;
                prompt += `\n\nYour new examples must use different contexts, sentence structures, and situations.`;
            }

            return prompt + `\n\nReturn a JSON array: [{"swedish": "...", "english": "..."}, ...]\nKeep it conversational and authentic!`;
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
