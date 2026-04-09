const keyManager = require('./keyManager');
const encryptionEngine = require('./encryption');
const logger = require('../../utils/logger');

/**
 * Crypto Service
 * Orchestrates encryption and decryption tasks for the entire system.
 */
class CryptoService {
  /**
   * Encrypt sensitive data using the current active master key and AAD
   */
  async encryptData(plaintext, aad = null) {
    if (!plaintext) return null;
    
    const { key, version } = keyManager.getActiveKey();
    const result = encryptionEngine.encrypt(plaintext, key, version, aad);
    
    return result;
  }

  /**
   * Decrypt data by automatically identifying the correct key version and verifying AAD
   */
  async decryptData(payload, aad = null) {
    if (!payload || !payload.version) {
      throw new Error('Invalid encryption payload (Missing Version)');
    }
    
    const key = keyManager.getKeyByVersion(payload.version);
    const plaintext = encryptionEngine.decrypt(payload, key, aad);
    
    return plaintext;
  }
}

module.exports = new CryptoService();
