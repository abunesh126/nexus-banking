const cryptoService = require('./cryptoService');
const logger = require('../../utils/logger');

/**
 * Vault Service
 * High-level orchestration for domain-specific encryption.
 */
class VaultService {
  /**
   * Securely process a card object for storage (AAD Bound)
   */
  async sealCardData(userId, cardData) {
    try {
      // NOTE: CVV IS NEVER STORED (COMPLIANCE)
      const lastFour = cardData.number.replace(/\s/g, '').slice(-4);
      
      // Bind encryption to the user's unique identity + card context
      const aad = `${userId}:${lastFour}`; 

      const encryptedNumber = await cryptoService.encryptData(cardData.number, aad);

      return {
        user_id: userId,
        card_type: cardData.type,
        card_number: JSON.stringify(encryptedNumber),
        last_four: lastFour,
        card_brand: this.detectBrand(cardData.number),
        expiry: cardData.expiry,
        label: cardData.label,
        color: cardData.color
      };
    } catch (error) {
      logger.error('Vault Seal Failure: Card', { error: error.message });
      throw new Error('Vault Error: Failed to seal card data');
    }
  }

  /**
   * Decrypt card data for an MFA-Verified Reveal (Internal)
   */
  async revealCardData(userId, card) {
    try {
      // 1. Verify Ownership
      if (card.user_id !== userId) {
        throw new Error('Unauthorized Access: Ownership mismatch');
      }

      // 2. Prepare AAD Binding
      const aad = `${userId}:${card.last_four}`;
      const payloadNumber = JSON.parse(card.card_number);

      // 3. Decrypt with Identity check
      const number = await cryptoService.decryptData(payloadNumber, aad);

      return {
        id: card.id,
        number,
        expiry: card.expiry,
        last_four: card.last_four
      };
    } catch (error) {
      logger.error('Vault Reveal Failure: Card', { error: error.message, cardId: card.id });
      throw new Error('Vault Error: Integrity Violation - Decryption Failed');
    }
  }

  detectBrand(number) {
    const raw = number.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'VISA';
    if (raw.startsWith('5')) return 'MASTERCARD';
    return 'VISA'; // Default
  }

  /**
   * Return masked card data (Safe for untrusted frontend)
   */
  maskCardData(card) {
    return {
      id: card.id,
      label: card.label,
      type: card.card_type,
      brand: card.card_brand || 'VISA',
      expiry: card.expiry,
      color: card.color,
      last_four: card.last_four || '****',
      number: '•••• •••• •••• ' + (card.last_four || '****')
    };
  }
}

module.exports = new VaultService();
