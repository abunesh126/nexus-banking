const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API Limiter: 100 requests / 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: true,
    type: 'RATE_LIMIT',
    message: 'Too many requests'
  },
  handler: (req, res, next, options) => {
    logger.error('Rate limit exceeded: General API', { ip: req.ip, url: req.originalUrl });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Limiter: 5 requests / 5 minutes
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    error: true,
    type: 'RATE_LIMIT',
    message: 'Too many requests'
  },
  handler: (req, res, next, options) => {
    logger.error('Rate limit exceeded: Auth', { ip: req.ip, url: req.originalUrl });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment Limiter: 10 requests / 1 minute
const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error: true,
    type: 'RATE_LIMIT',
    message: 'Too many requests'
  },
  handler: (req, res, next, options) => {
    logger.error('Rate limit exceeded: Payments', { ip: req.ip, url: req.originalUrl });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  paymentLimiter,
};
