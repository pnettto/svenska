/**
 * AI prompts configuration for Swedish language learning
 */

const prompts = {
    exampleGeneration: {
        system: 'You are a Swedish language teacher helping students learn Swedish. Generate simple, practical example sentences that demonstrate how to use Swedish words in everyday contexts. Each example should be at A2-B1 level (beginner to intermediate).',
        
        user: (swedishWord, englishTranslation, existingExamples) => {
            let prompt = `Generate 3 example sentences using the Swedish word "${swedishWord}" (which means "${englishTranslation}" in English).`;
            
            if (existingExamples && existingExamples.length > 0) {
                prompt += `\n\nIMPORTANT: The following examples ALREADY EXIST. You must generate NEW and DIFFERENT examples that are NOT similar to these:\n`;
                existingExamples.forEach((example, index) => {
                    prompt += `${index + 1}. ${example.swedish}\n`;
                });
                prompt += `\nYour new examples must:\n- Use DIFFERENT contexts (e.g., if existing examples are about work, use home, travel, hobbies, etc.)\n- Use DIFFERENT sentence structures (e.g., questions, commands, compound sentences)\n- Vary in complexity level (mix of simpler A2 and more complex B1 sentences)\n- Demonstrate different grammatical uses of the word\n- Be creative and avoid any similarity to the existing examples above`;
            }
            
            prompt += `\n\nFor each example, provide:\n1. The Swedish sentence\n2. The English translation\n\nFormat your response as a JSON array with objects containing "swedish" and "english" properties. Example format:\n[{"swedish": "...", "english": "..."}, {"swedish": "...", "english": "..."}, {"swedish": "...", "english": "..."}]\n\nMake the sentences natural, practical, and at beginner-intermediate level.`;
            
            return prompt;
        }
    },
    
    translation: {
        system: 'You are a professional translator. Translate the given text accurately and concisely. Return ONLY the translated text without any explanations, notes, or additional context.',
        
        user: (text, sourceLang, targetLang) => `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`
    }
};

module.exports = prompts;
