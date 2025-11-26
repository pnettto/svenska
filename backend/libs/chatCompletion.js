const OpenAI = require('openai');
const config = require('../config');

/**
 * Simplified chat completion using OpenAI
 * Removed provider abstraction since we only use OpenAI
 */
async function chatCompletion(options) {
    const {
        messages,
        model,
        temperature = 0.7,
        max_tokens,
        response_format
    } = options;

    if (!config.openai.apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const client = new OpenAI({
        apiKey: config.openai.apiKey,
        baseURL: 'https://api.openai.com/v1'
    });

    const params = {
        model: model || config.openai.model,
        messages,
        temperature
    };

    if (max_tokens) params.max_tokens = max_tokens;
    if (response_format) params.response_format = response_format;

    try {
        const completion = await client.chat.completions.create(params);

        return {
            content: completion.choices[0].message.content,
            role: completion.choices[0].message.role,
            model: completion.model,
            usage: completion.usage
        };
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}

module.exports = { chatCompletion };
