const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Get server health status
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
