const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const cryptoService = require('./crypto/cryptoService');
const logger = require('../utils/logger');

/**
 * MFA Service
 * Logic for TOTP-based Multi-Factor Authentication.
 */
class MfaService {
  constructor() {
    authenticator.options = { window: 1 }; // Allow ±30 seconds window
  }

  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(userEmail) {
    try {
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(userEmail, 'NexusBank', secret);
      const qrCodeData = await qrcode.toDataURL(otpauth);
      
      return {
        secret,      // RAW secret (temporary for setup)
        qrCodeData   // Base64 QR code
      };
    } catch (error) {
      logger.error('MFA Secret Generation Failure', { error: error.message });
      throw new Error('MFA Error: Failed to generate enrollment data');
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  async verifyToken(token, secret) {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      logger.error('MFA Token Verification Error', { error: error.message });
      return false;
    }
  }

  /**
   * Encrypt a secret for database storage
   */
  async encryptSecret(secret) {
    const encrypted = await cryptoService.encryptData(secret, 'MFA_SECRET');
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt a secret from database storage
   */
  /**
   * Calculate a salted hash of client identifiers (IP + UA)
   */
  getFingerprintHash(ip, ua) {
    const salt = process.env.AUDIT_GENESIS_SEED || 'DEFAULT_IDENTITY_SALT';
    return require('crypto')
      .createHash('sha256')
      .update(`${ip}|${ua}|${salt}`)
      .digest('hex');
  }

  /**
   * Generate 8 unique, single-use recovery codes
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 8; i++) {
        codes.push(require('crypto').randomBytes(4).toString('hex'));
    }
    return codes;
  }

  /**
   * Encrypt recovery codes for storage
   */
  async encryptBackupCodes(codes) {
    const encrypted = await cryptoService.encryptData(JSON.stringify(codes), 'BACKUP_CODES');
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt and parse recovery codes
   */
  async decryptBackupCodes(encryptedBlob) {
    const payload = JSON.parse(encryptedBlob);
    const decrypted = await cryptoService.decryptData(payload, 'BACKUP_CODES');
    return JSON.parse(decrypted);
  }
}

module.exports = new MfaService();
