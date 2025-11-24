const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./words');
const aiRoutes = require('./ai');
const speechRoutes = require('./speech');
const utilsRoutes = require('./utils');
const authRoutes = require('./auth');

const { requireAuth } = require('../middleware/auth');

// Mount routes with proper namespacing
router.use('/words', requireAuth, wordsRoutes);
router.use('/ai', requireAuth, aiRoutes);
router.use('/speech', speechRoutes); // Public access for audio files
router.use('/utils', utilsRoutes);
router.use('/auth', authRoutes);

module.exports = router;
