require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,

    // Environment
    isProduction: process.env.NODE_ENV === 'production' || !!process.env.FLY_APP_NAME,
    flyAppName: process.env.FLY_APP_NAME,

    // Database
    database: {
        path: process.env.FLY_APP_NAME ? '/data/words.db' : 'data/words.db'
    },

    // Iron Session
    ironSession: {
        cookieName: 'svenska_session',
        password: process.env.SESSION_SECRET,
        // secure: true should be used in production (HTTPS) but can be false in dev
        cookieOptions: {
            secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development', // Always secure for SameSite=None
            sameSite: 'none', // Required for cross-origin (extension)
            httpOnly: true,
        },
        ttl: 24 * 60 * 60 // 24 hours in seconds
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
        pin: process.env.PIN,
        sessionSecret: process.env.SESSION_SECRET,
        sessionMaxAge: 24 * 60 * 60 * 1000 // 24 hours
    },

    // CORS
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000']
    },

    // Security
    security: {
        requestSizeLimit: '10kb',
        enforceHttps: process.env.NODE_ENV === 'production'
    }
};
