const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./words');
const aiRoutes = require('./ai');
const speechRoutes = require('./speech');
const utilsRoutes = require('./utils');

// Mount routes
router.use('/words', wordsRoutes);
router.use('/', aiRoutes);
router.use('/', speechRoutes);
router.use('/', utilsRoutes);

module.exports = router;
