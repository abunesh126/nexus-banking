const logger = require('../utils/logger');

// In-memory map to track failed attempts
// In a production app, use Redis or a DB instead
const failureMap = new Map();

const FAILURE_THRESHOLD = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Anomaly Detection Middleware
 * Blocks IPs that have exceeded the failure threshold
 */
const anomalyMiddleware = (req, res, next) => {
  const ip = req.ip;
  const data = failureMap.get(ip);

  if (data && data.blockedUntil && data.blockedUntil > Date.now()) {
    logger.error('Access blocked due to anomaly: Persistent failures', { ip });
    return res.status(403).json({
      error: true,
      message: 'Access restricted. Too many failed attempts.'
    });
  }

  next();
};

/**
 * Record a failure for an IP
 */
const recordFailure = (ip) => {
  const now = Date.now();
  const data = failureMap.get(ip) || { attempts: 0, blockedUntil: null };

  data.attempts += 1;
  
  if (data.attempts >= FAILURE_THRESHOLD) {
    data.blockedUntil = now + BLOCK_DURATION_MS;
    logger.error('IP Blocked: Max failure threshold reached', { ip, blockedUntil: new Date(data.blockedUntil).toISOString() });
  }

  failureMap.set(ip, data);
};

/**
 * Reset failures for an IP
 */
const resetFailures = (ip) => {
  failureMap.delete(ip);
  logger.info('Failure count reset for IP', { ip });
};

module.exports = {
  anomalyMiddleware,
  recordFailure,
  resetFailures
};
