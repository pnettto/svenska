const OpenAI = require('openai');
const config = require('../config');

const PROVIDERS = {
    openai: {
        baseURL: 'https://api.openai.com/v1',
        defaultModel: config.openai.model,
        apiKey: config.openai.apiKey,
        isOpenAI: true
    },
};

async function chatCompletion(options) {
    const {
        messages,
        model,
        temperature = 0.7,
        max_tokens,
        response_format,
        provider: overrideProvider
    } = options;

    const providerKey = overrideProvider || 'openai';
    const providerConfig = PROVIDERS[providerKey];
    const apiKey = providerConfig.apiKey;
    
    if (!apiKey) {
        throw new Error(`API key not configured for provider: ${providerKey}`);
    }

    const modelToUse = model || providerConfig.defaultModel;

    try {
        if (providerConfig.isOpenAI) {
            return await callOpenAICompatibleAPI({
                apiKey,
                baseURL: providerConfig.baseURL,
                messages,
                model: modelToUse,
                temperature,
                max_tokens,
                response_format
            });
        }
    } catch (error) {
        console.error(`${providerKey} API error:`, error);
        throw error;
    }
}

async function callOpenAICompatibleAPI(config) {
    const { apiKey, baseURL, messages, model, temperature, max_tokens, response_format } = config;

    const client = new OpenAI({ apiKey, baseURL });
    const params = { model, messages, temperature };

    if (max_tokens) params.max_tokens = max_tokens;
    if (response_format) params.response_format = response_format;

    const completion = await client.chat.completions.create(params);

    return {
        content: completion.choices[0].message.content,
        role: completion.choices[0].message.role,
        model: completion.model,
        usage: completion.usage
    };
}

module.exports = { chatCompletion };
