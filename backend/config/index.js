require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    
    // Environment
    isProduction: !!process.env.FLY_APP_NAME,
    flyAppName: process.env.FLY_APP_NAME,
    
    // Database
    database: {
        path: process.env.FLY_APP_NAME ? '/data/words.db' : 'data/words.db'
    },
    
    // Speech/Audio
    speech: {
        cacheDir: process.env.FLY_APP_NAME ? '/data/speech' : 'data/speech',
        defaultVoice: 'Astrid',
        languageCode: 'sv-SE'
    },
    
    // AWS
    aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    
    // OpenAI
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini'
    },
    
    // Auth
    auth: {
        pinHash: process.env.PIN_HASH,
        sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
        sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
        rateLimitMax: 20,
        rateLimitWindowMs: 15 * 60 * 1000 // 15 minutes
    }
};
