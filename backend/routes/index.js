const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./routes/words');
const aiRoutes = require('./routes/ai');
const speechRoutes = require('./routes/speech');
const utilsRoutes = require('./routes/utils');

// Mount routes
router.use('/words', wordsRoutes);
router.use('/', aiRoutes);
router.use('/', speechRoutes);
router.use('/', utilsRoutes);

module.exports = router;
