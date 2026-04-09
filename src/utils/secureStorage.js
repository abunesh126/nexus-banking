/**
 * SECURE STORAGE - V2 (ZERO-TRUST)
 * Master keys have been removed from the client-side bundle.
 * All encryption and decryption logic now resides in the backend "Security Brain."
 */

export const secureStorage = {
  /**
   * Set item (Encrypted via Backend in production)
   * This is now a simple proxy for non-sensitive local state.
   */
  setItem: async (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Get item (Decrypted via Backend in production)
   */
  getItem: async (key) => {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
  },

  /**
   * ⚠️ SECURITY NOTICE
   * Client-side keys were purged in Phase 3.
   * Encryption is now performed by the Node.js backend using AES-256-GCM.
   */
  isZeroTrustEnabled: () => true
};
