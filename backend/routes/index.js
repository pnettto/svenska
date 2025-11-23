const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./words');
const aiRoutes = require('./ai');
const speechRoutes = require('./speech');
const utilsRoutes = require('./utils');
const authRoutes = require('./auth');

// Mount routes with proper namespacing
router.use('/words', wordsRoutes);
router.use('/ai', aiRoutes);
router.use('/speech', speechRoutes);
router.use('/utils', utilsRoutes);
router.use('/auth', authRoutes);

module.exports = router;
