const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

// Mount all API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Base endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
