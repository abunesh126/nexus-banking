const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Store Service
 * In-memory secure state management for ephemeral security tokens.
 */
class StoreService {
  constructor() {
    // TTLs in seconds
    this.sessionCache = new NodeCache({ stdTTL: 300 });  // 5 Minutes (MFA Window)
    this.tokenCache = new NodeCache({ stdTTL: 120 });    // 2 Minutes (Reveal Token)
    this.attemptCache = new NodeCache({ stdTTL: 60 });   // 1 Minute (Abuse Detection)
  }

  // --- MFA SESSION MANAGEMENT ---
  
  setMfaSession(userId) {
    this.sessionCache.set(userId, {
      verified: true,
      verifiedAt: Date.now()
    });
  }

  getMfaSession(userId) {
    return this.sessionCache.get(userId);
  }

  clearMfaSession(userId) {
    this.sessionCache.del(userId);
  }

  // --- REVEAL TOKEN MANAGEMENT (Anti-Replay) ---

  generateRevealToken(userId) {
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    this.tokenCache.set(token, userId);
    return token;
  }

  consumeRevealToken(token, userId) {
    const ownerId = this.tokenCache.get(token);
    if (!ownerId || ownerId !== userId) {
      return false;
    }
    this.tokenCache.del(token);
    return true;
  }

  // --- ABUSE TRACKING ---

  incrementAttempts(userId) {
    const current = this.attemptCache.get(userId) || 0;
    const updated = current + 1;
    this.attemptCache.set(userId, updated);
    return updated;
  }

  incrementMfaAttempts(userId) {
    const key = `mfa_attempts:${userId}`;
    const current = this.attemptCache.get(key) || 0;
    const updated = current + 1;
    this.attemptCache.set(key, updated, 300); // 5 minute window
    return updated;
  }

  resetMfaAttempts(userId) {
    this.attemptCache.del(`mfa_attempts:${userId}`);
  }
}

module.exports = new StoreService();
