const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter for card reveal
 * Limits brute-force or scraping attempts on PII.
 */
const revealLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    type: 'RATE_LIMIT',
    message: 'Too many reveal attempts. Security lockout active.'
  }
});

module.exports = { revealLimiter };
