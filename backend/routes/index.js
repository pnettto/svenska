const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./words');
const aiRoutes = require('./ai');
const speechRoutes = require('./speech');
const utilsRoutes = require('./utils');
const authRoutes = require('./auth');

// Mount routes
router.use('/', wordsRoutes);
router.use('/', aiRoutes);
router.use('/', speechRoutes);
router.use('/', utilsRoutes);
router.use('/', authRoutes);

module.exports = router;
