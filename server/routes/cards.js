const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const vaultService = require('../services/crypto/vaultService');
const authMiddleware = require('../middleware/authMiddleware');
const storeService = require('../services/storeService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/cards
 * @desc    Get all cards for user (Masked Metadata)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: cards, error } = await supabaseAdmin
      .from('virtual_cards')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json(cards.map(c => vaultService.maskCardData(c)));
  } catch (err) {
    logger.error('API Card Fetch Error', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve cards' });
  }
});

/**
 * @route   GET /api/cards/:id/reveal
 * @desc    Get full decrypted card details (Hardened Reveal)
 * @access  Private + MFA Session + Reveal Token
 */
router.get('/:id/reveal', authMiddleware, async (req, res) => {
  const cardId = req.params.id;
  const revealToken = req.headers['x-reveal-token'];

  try {
    // 1. INTRUSION DETECTION: Check for abuse thresholds
    const attempts = storeService.incrementAttempts(req.user.id);
    if (attempts > 3) {
      await logSecurityEvent(req.user.id, 'REVEAL_ABUSE', 'CRITICAL', { attempts });
      return res.status(429).json({
        error: true,
        type: 'RATE_LIMIT',
        message: 'Suspicious activity detected. Forensic alert triggered.'
      });
    }

    // 2. SESSION CONTROL: Verify MFA Window (5 minutes)
    const mfaSession = storeService.getMfaSession(req.user.id);
    if (!mfaSession || Date.now() - mfaSession.verifiedAt > 300000) {
      return res.status(403).json({
        error: true,
        message: 'MFA Window Expired. Please re-verify identity.'
      });
    }

    // 3. ANTI-REPLAY: Validate and Consume Reveal Token
    const isTokenValid = storeService.consumeRevealToken(revealToken, req.user.id);
    if (!isTokenValid) {
      await logSecurityEvent(req.user.id, 'REVEAL_TOKEN_VIOLATION', 'HIGH', { revealToken });
      return res.status(403).json({
        error: true,
        message: 'Invalid or expired reveal token'
      });
    }

    // 4. DATA RETRIEVAL: Fetch and Verify Ownership
    const { data: card, error } = await supabaseAdmin
      .from('virtual_cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !card) {
      await logSecurityEvent(req.user.id, 'UNAUTHORIZED_REVEAL_ATTEMPT', 'HIGH', { card_id: cardId });
      return res.status(404).json({ error: 'Card not found' });
    }

    // 5. DECRYPTION (AAD Bound)
    const revealed = await vaultService.revealCardData(req.user.id, card);

    // 6. FORENSIC AUDIT (Sanitized Logging)
    await logSecurityEvent(req.user.id, 'CARD_REVEAL', 'HIGH', { 
      card_id: cardId,
      last_four: card.last_four
    });

    // 7. EPHEMERAL HARDENING: Cache Control
    res.set({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(revealed);
  } catch (err) {
    logger.error('API Card Reveal Error', { error: err.message });
    res.status(400).json({ error: 'Integrity violation or verification failed' });
  }
});

/**
 * @route   POST /api/cards
 * @desc    Create sealed card
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const sealed = await vaultService.sealCardData(req.user.id, req.body);
    const { data, error } = await supabaseAdmin
      .from('virtual_cards')
      .insert([sealed])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(vaultService.maskCardData(data));
  } catch (err) {
    logger.error('API Card Creation Error', { error: err.message });
    res.status(500).json({ error: 'Failed to create card' });
  }
});

/**
 * Audit Logger
 */
async function logSecurityEvent(userId, type, severity, metadata) {
  try {
    await supabaseAdmin.from('security_events').insert([{
      event_type: type,
      severity: severity,
      user_id: userId,
      metadata: { ...metadata, timestamp: new Date().toISOString() }
    }]);
  } catch (err) {
    logger.error('Security Logging Failed', { error: err.message });
  }
}

module.exports = router;
