const { v4: uuidv4 } = require('uuid');

/**
 * Sensitive data masking utility
 */
const maskSensitiveData = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'authorization', 'key', 'cvv'];
  const maskedData = { ...data };

  for (const key in maskedData) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      maskedData[key] = '********';
    } else if (typeof maskedData[key] === 'object') {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  }
  
  return maskedData;
};

/**
 * Logger utility for NexusBank
 * Provides structured logging with timestamps and request IDs
 */
const logger = {
  info: (message, meta = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
class Logger {
  /**
   * Remove sensitive fields from metadata before logging
   */
  sanitize(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    // Recursive sanitization
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    const SENSITIVE_KEYS = ['card_number', 'cvv', 'ciphertext', 'tag', 'token', 'password'];

    Object.keys(sanitized).forEach(key => {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    });

    return sanitized;
  }

  info(message, metadata = {}) {
    console.info(`[INFO] [${new Date().toISOString()}] ${message}`, this.sanitize(metadata));
  }

  error(message, metadata = {}) {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, this.sanitize(metadata));
  }
}

module.exports = new Logger();
