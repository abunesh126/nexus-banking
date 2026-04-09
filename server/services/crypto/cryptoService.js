const keyManager = require('./keyManager');
const encryptionEngine = require('./encryption');
const logger = require('../../utils/logger');

/**
 * Crypto Service
 * Orchestrates encryption and decryption tasks for the entire system.
 */
class CryptoService {
  /**
   * Encrypt sensitive data using the current active master key
   */
  async encryptData(plaintext) {
    if (!plaintext) return null;
    
    const { key, version } = keyManager.getActiveKey();
    const result = encryptionEngine.encrypt(plaintext, key, version);
    
    logger.info('Data Encrypted', { version, requestId: 'crypto-op' });
    return result;
  }

  /**
   * Decrypt data by automatically identifying the correct key version
   */
  async decryptData(payload) {
    if (!payload || !payload.version) {
      throw new Error('Invalid encryption payload (Missing Version)');
    }
    
    const key = keyManager.getKeyByVersion(payload.version);
    const plaintext = encryptionEngine.decrypt(payload, key);
    
    return plaintext;
  }
}

module.exports = new CryptoService();
