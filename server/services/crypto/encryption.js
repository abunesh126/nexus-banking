const crypto = require('crypto');
const logger = require('../../utils/logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM

/**
 * Encryption Engine
 * Implements AES-256-GCM for Zero-Trust data protection.
 */
class EncryptionEngine {
  /**
   * Encrypt plaintext using a versioned key
   */
  encrypt(plaintext, key, version) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');
      
      const tag = cipher.getAuthTag().toString('hex');
      
      return {
        version,
        iv: iv.toString('hex'),
        ciphertext,
        tag
      };
    } catch (error) {
      logger.error('Encryption Failure', { error: error.message });
      throw new Error('Cryptographic Core Failure: Encrypt');
    }
  }

  /**
   * Decrypt payload and verify integrity via Auth Tag
   */
  decrypt(payload, key) {
    try {
      const { iv, ciphertext, tag } = payload;
      const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');
      
      return plaintext;
    } catch (error) {
      logger.error('Decryption Integrity Failure (Possible Tampering)', { error: error.message });
      throw new Error('Cryptographic Integrity Breach: Verification Failed');
    }
  }
}

module.exports = new EncryptionEngine();
