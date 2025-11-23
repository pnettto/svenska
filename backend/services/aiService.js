const { chatCompletion } = require('../libs/chatCompletion');
const prompts = require('../prompts');

class AIService {
    async generateExamples(swedishWord, englishTranslation, existingExamples = []) {
        const response = await chatCompletion({
            messages: [
                { role: 'system', content: prompts.exampleGeneration.system },
                { role: 'user', content: prompts.exampleGeneration.user(swedishWord, englishTranslation, existingExamples) }
            ],
            temperature: 0.4,
            max_tokens: 300,
            response_format: { type: "json_object" }
        });

        const content = response.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/) || [content];
        return JSON.parse(jsonMatch[0]);
    }

    async translate(text, sourceLang = 'sv', targetLang = 'en') {
        const response = await chatCompletion({
            messages: [
                { role: 'system', content: prompts.translation.system },
                { role: 'user', content: prompts.translation.user(text, sourceLang, targetLang) }
            ],
            temperature: 0.3,
            max_tokens: 500
        });

        return response.content.trim();
    }

    async generateRandomWord() {
        const response = await chatCompletion({
            messages: [
                { role: 'system', content: prompts.randomWord.system },
                { role: 'user', content: prompts.randomWord.user() }
            ],
            temperature: 0.8,
            max_tokens: 100,
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.content);
    }
}

module.exports = new AIService();
