const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./words');
const aiRoutes = require('./ai');
const speechRoutes = require('./speech');
const utilsRoutes = require('./utils');
const authRoutes = require('./auth');

const { requireAuthOrLimit } = require('../middleware/auth');

// Mount routes with proper namespacing
router.use('/words', requireAuthOrLimit, wordsRoutes);
router.use('/ai', requireAuthOrLimit, aiRoutes);
router.use('/speech', requireAuthOrLimit, speechRoutes);
router.use('/utils', utilsRoutes);
router.use('/auth', authRoutes);

module.exports = router;
