const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const storeService = require('../services/storeService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/verify-mfa
 * @desc    Simulate MFA verification and generate an ephemeral Reveal Token.
 * @access  Private
 */
router.post('/verify-mfa', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    // Phase 5 Logic: Verify TOTP code here.
    // For now, we simulate success if a code is provided.
    if (!code || code !== '123456') {
      logger.error('MFA Verification Failed', { userId: req.user.id });
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // 1. Establish MFA Session Window (5 minutes)
    storeService.setMfaSession(req.user.id);

    // 2. Generate One-Time Reveal Token (2 minutes)
    const revealToken = storeService.generateRevealToken(req.user.id);

    logger.info('MFA Verified - Reveal Token Generated', { userId: req.user.id });

    res.json({
      success: true,
      reveal_token: revealToken,
      expires_in: 120 // 2 minutes
    });
  } catch (err) {
    logger.error('MFA Verification Exception', { error: err.message });
    res.status(500).json({ error: 'Internal Identity Failure' });
  }
});

module.exports = router;
