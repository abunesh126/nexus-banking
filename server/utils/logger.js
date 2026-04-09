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
      requestId: meta.requestId || uuidv4(),
      ...maskSensitiveData(meta)
    };
    console.log(JSON.stringify(logEntry));
  },
  
  error: (message, meta = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      requestId: meta.requestId || uuidv4(),
      ...maskSensitiveData(meta)
    };
    console.error(JSON.stringify(logEntry));
  }
};

module.exports = logger;
