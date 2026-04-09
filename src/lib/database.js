import { apiClient } from './apiClient';

/* ═══════════════════════════════════════════════════════════════════
   ██  PROFILES
   ═══════════════════════════════════════════════════════════════════ */

export async function getProfile() {
  return apiClient.get('/auth/profile');
}

export async function updateProfile(updates) {
  return apiClient.put('/auth/profile', updates);
}

/* ═══════════════════════════════════════════════════════════════════
   ██  ACCOUNTS (Internal Proxy Only)
   ═══════════════════════════════════════════════════════════════════ */

export async function getAccount() {
  return apiClient.get('/transactions/account');
}

// NOTE: updateBalance, deductBalance, and addMoney are NO LONGER 
// available from frontend for security. Handled internally by /transfer.

/* ═══════════════════════════════════════════════════════════════════
   ██  TRANSACTIONS
   ═══════════════════════════════════════════════════════════════════ */

export async function getTransactions() {
  return apiClient.get('/transactions');
}

/**
 * Modern Secure Transfer (Phase 6/7/8 Flow)
 */
export async function processTransfer(payload) {
  return apiClient.post('/transactions/transfer', payload);
}

/* ═══════════════════════════════════════════════════════════════════
   ██  VIRTUAL CARDS
   ═══════════════════════════════════════════════════════════════════ */

export async function getCards() {
  return apiClient.get('/cards');
}

export async function createCard(card) {
  return apiClient.post('/cards', card);
}

export async function deleteCard(cardId) {
  return apiClient.delete(`/cards/${cardId}`);
}

export async function revealCard(cardId, revealToken = null) {
  return apiClient.get(`/cards/${cardId}/reveal`, {
    headers: revealToken ? { 'x-reveal-token': revealToken } : {}
  });
}

/* ═══════════════════════════════════════════════════════════════════
   ██  REWARDS
   ═══════════════════════════════════════════════════════════════════ */

export async function getRewards() {
  return apiClient.get('/rewards');
}

export async function redeemRewards(points) {
  return apiClient.post('/rewards/redeem', { points });
}

/* ═══════════════════════════════════════════════════════════════════
   ██  AUDIT LOGS
   ═══════════════════════════════════════════════════════════════════ */

export async function writeAuditLog(action, metadata = {}) {
  // Use backend severity engine via proxy
  return apiClient.post('/audit/log', { action, metadata });
}

export async function getAuditLogs() {
  return apiClient.get('/audit');
}
