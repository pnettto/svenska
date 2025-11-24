const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const config = require('./config');
const { globalLimiter, speedLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Trust proxy - required for Fly.io and rate limiting
app.set('trust proxy', 1);

// Security: Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Security: HTTPS enforcement in production
if (config.security.enforceHttps) {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(`https://${req.header('host')}${req.url}`);
        }
        next();
    });
}

// Security: CORS with origin restrictions
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Trim whitespace from allowed origins
        const allowedOrigins = config.cors.allowedOrigins.map(o => o.trim());
        if (allowedOrigins.includes(origin) ||
            origin.startsWith('chrome-extension://')) {
            callback(null, true);
        } else {
            // Don't throw error, just reject with false
            callback(null, false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Security: Request size limit
app.use(express.json({ limit: config.security.requestSizeLimit }));

// Security: Rate limiting
app.use('/api', speedLimiter);
app.use('/api', globalLimiter);

// Observability: log every API request with user details (if any)
app.use('/api', requestLogger);

// Mount all API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Base endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

// Security: Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Don't leak error details in production
    const message = config.isProduction
        ? 'Internal server error'
        : err.message;

    res.status(err.status || 500).json({
        error: message,
        ...(config.isProduction ? {} : { stack: err.stack })
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.isProduction ? 'production' : 'development'}`);
});
