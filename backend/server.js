const express = require('express');
const cors = require('cors');
const dataRouter = require('./routes/data-routes');
const llmRouter = require('./routes/llm-routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your extension
app.use(cors());
app.use(express.json());

// Mount word management routes
app.use('/api', dataRouter);

// Mount LLM routes
app.use('/api', llmRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Base endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
