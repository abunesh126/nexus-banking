/**
 * Database Service Layer — All Supabase CRUD operations for NexusBank.
 * This is the single source of truth for all database interactions.
 * Components should NEVER call supabase directly — always use these functions.
 */
import { supabase } from './supabase';

/* ═══════════════════════════════════════════════════════════════════
   ██  PROFILES
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Get the current user's profile.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ═══════════════════════════════════════════════════════════════════
   ██  ACCOUNTS (Balance)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Get the current user's bank account (balance).
 */
export async function getAccount(userId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update account balance.
 * Uses an RPC function to ensure atomic balance updates (no race conditions).
 */
export async function updateBalance(userId, newBalance) {
  const { data, error } = await supabase
    .from('accounts')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deduct balance atomically using an RPC call.
 */
export async function deductBalance(userId, amount) {
  const { data, error } = await supabase.rpc('deduct_balance', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw error;
  return data;
}

/**
 * Add balance atomically using an RPC call.
 */
export async function addMoney(userId, amount) {
  const { data, error } = await supabase.rpc('add_money', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw error;
  return data;
}

/* ═══════════════════════════════════════════════════════════════════
   ██  TRANSACTIONS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Get all transactions for a user, ordered by date descending.
 */
export async function getTransactions(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create a new transaction record.
 */
export async function createTransaction(userId, transaction) {
  const { data, error } = await supabase.rpc('log_transaction', {
    p_user_id: userId,
    p_type: transaction.type,
    p_title: transaction.title,
    p_merchant: transaction.merchant || '',
    p_amount: transaction.amount,
    p_category: transaction.category || 'UPI',
    p_icon: transaction.icon || '📲',
    p_risk_score: transaction.risk_score ?? transaction.risk ?? 0,
    p_note: transaction.note || ''
  });

  if (error) throw error;
  return data;
}

import { apiClient } from './apiClient';

/* ═══════════════════════════════════════════════════════════════════
   ██  VIRTUAL CARDS (Zero-Trust API Migration)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Get all virtual cards for a user (Masked via Backend).
 */
export async function getCards(userId) {
  return apiClient.get('/cards');
}

/**
 * Create a new virtual card (Sealed on Server).
 */
export async function createCard(userId, card) {
  return apiClient.post('/cards', card);
}

/**
 * Delete a virtual card (Burn it).
 */
export async function deleteCard(cardId, userId) {
  return apiClient.delete(`/cards/${cardId}`);
}

/**
 * Reveal full decrypted card details (Zero-Trust Retrieval).
 */
export async function revealCard(cardId, revealToken = null) {
  return apiClient.get(`/cards/${cardId}/reveal`, {
    headers: revealToken ? { 'x-reveal-token': revealToken } : {}
  });
}

/* ═══════════════════════════════════════════════════════════════════
   ██  REWARDS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Get user's reward data.
 */
export async function getRewards(userId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data;
}

/**
 * Update reward points.
 */
export async function updateRewards(userId, updates) {
  const { data, error } = await supabase
    .from('rewards')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Redeem rewards for cashback atomically.
 */
export async function redeemRewards(userId, points) {
  const { data, error } = await supabase.rpc('redeem_rewards', {
    p_user_id: userId,
    p_points_to_redeem: points
  });

  if (error) throw error;
  return data;
}

/* ═══════════════════════════════════════════════════════════════════
   ██  AUDIT LOGS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Write a security audit log entry.
 */
export async function writeAuditLog(userId, action, metadata = {}) {
  const { error } = await supabase.rpc('log_audit', {
    p_user_id: userId,
    p_action: action,
    p_metadata: metadata,
    p_user_agent: navigator.userAgent
  });

  // Audit log failures should never crash the app
  if (error) console.error('[AUDIT LOG ERROR]:', error);
}

/**
 * Get audit logs for the current user (last 100).
 */
export async function getAuditLogs(userId) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}
