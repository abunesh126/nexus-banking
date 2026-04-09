const logger = require('../../utils/logger');

/**
 * Key Manager Service
 * Responsible for retrieving cryptographic keys based on versions.
 */
class KeyManager {
  constructor() {
    this.keys = {
      v1: process.env.MASTER_KEY_V1,
      v2: process.env.MASTER_KEY_V2
    };
    this.activeVersion = process.env.ACTIVE_KEY_VERSION || 'v1';
  }

  /**
   * Get the current active encryption key
   */
  getActiveKey() {
    const key = this.keys[this.activeVersion];
    if (!key) {
      logger.error('Missing active master key version', { version: this.activeVersion });
      throw new Error('Cryptographic Error: Active key unavailable');
    }
    return {
      version: this.activeVersion,
      key: Buffer.from(key, 'base64')
    };
  }

  /**
   * Get a specific key version (for decrypting historical data)
   */
  getKeyByVersion(version) {
    const key = this.keys[version];
    if (!key) {
      logger.error('Missing historical master key version', { version });
      throw new Error('Cryptographic Error: Historical key unavailable');
    }
    return Buffer.from(key, 'base64');
  }

  /**
   * Returns the list of available versions (for audits/scans)
   */
  getAvailableVersions() {
    return Object.keys(this.keys).filter(v => !!this.keys[v]);
  }
}

module.exports = new KeyManager();
