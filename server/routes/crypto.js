const express = require('express');
const router = express.Router();
const cryptoService = require('../services/crypto/cryptoService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/crypto/encrypt
 * @desc    Encrypt sensitive data (Internal Use)
 * @access  Private
 */
router.post('/encrypt', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Data required' });

    const encrypted = await cryptoService.encryptData(data);
    res.json(encrypted);
  } catch (err) {
    logger.error('API Encryption Error', { error: err.message });
    res.status(500).json({ error: 'Cryptographic failure' });
  }
});

/**
 * @route   POST /api/crypto/decrypt
 * @desc    Decrypt sensitive data (Internal Use)
 * @access  Private
 */
router.post('/decrypt', async (req, res) => {
  try {
    const payload = req.body; // Expecting { version, iv, ciphertext, tag }
    
    if (!payload.ciphertext || !payload.tag || !payload.version) {
      return res.status(400).json({ error: 'Valid encryption payload required' });
    }

    const decrypted = await cryptoService.decryptData(payload);
    res.json({ data: decrypted });
  } catch (err) {
    logger.error('API Decryption Error', { error: err.message });
    res.status(400).json({ error: 'Integrity violation or key mismatch' });
  }
});

module.exports = router;
