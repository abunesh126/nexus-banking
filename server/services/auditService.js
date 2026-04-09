const crypto = require('crypto');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const logger = require('../utils/logger');

/**
 * Audit Service
 * Maintains a SHA-256 hash chain of user activity logs.
 */
class AuditService {
  constructor() {
    this.genesisSeed = process.env.AUDIT_GENESIS_SEED || 'DEFAULT_GENESIS_SEED';
  }

  /**
   * Append a new log entry to the user's hash chain
   */
  async appendLog(userId, action, metadata = {}, userAgent = '', ipAddress = '') {
    try {
      // 1. Fetch the latest log to get the 'previous_hash'
      const { data: lastLog, error: fetchError } = await supabaseAdmin
        .from('audit_logs')
        .select('hash')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // If no logs exist, use the Genesis Seed relative to the user
      const previousHash = (fetchError || !lastLog) 
        ? crypto.createHash('sha256').update(`${userId}:${this.genesisSeed}`).digest('hex')
        : lastLog.hash;

      // 2. Prepare payload for hashing
      const timestamp = new Date().toISOString();
      const payload = `${userId}|${action}|${JSON.stringify(metadata)}|${timestamp}|${previousHash}`;
      
      // 3. Calculate Hash
      const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

      // 4. Insert into DB (Bypassing RLS via admin client)
      const { error: insertError } = await supabaseAdmin
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action,
          metadata,
          user_agent: userAgent,
          ip_address: ipAddress,
          previous_hash: previousHash,
          hash: currentHash,
          created_at: timestamp
        }]);

      if (insertError) throw insertError;

      logger.info('Audit Log Chained', { userId, action, hash: currentHash.slice(0, 8) });
      return currentHash;
    } catch (err) {
      logger.error('Audit Chaining Failure', { error: err.message, userId, action });
      // In a 10/10 system, we might block the action if logging fails.
      return null;
    }
  }

  /**
   * Verify the entire chain for a user
   */
  async verifyChain(userId) {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!logs || logs.length === 0) return { valid: true, count: 0 };

      let expectedPreviousHash = crypto.createHash('sha256').update(`${userId}:${this.genesisSeed}`).digest('hex');

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // 1. Check if previous_hash matches the expected linkage
        if (log.previous_hash !== expectedPreviousHash) {
          return { valid: false, brokenAt: log.id, reason: 'Linkage Mismatch' };
        }

        // 2. Recalculate hash
        const payload = `${userId}|${log.action}|${JSON.stringify(log.metadata)}|${new Date(log.created_at).toISOString()}|${log.previous_hash}`;
        const calculatedHash = crypto.createHash('sha256').update(payload).digest('hex');

        if (log.hash !== calculatedHash) {
          return { valid: false, brokenAt: log.id, reason: 'Content Tampering' };
        }

        expectedPreviousHash = log.hash;
      }

      return { valid: true, count: logs.length };
    } catch (err) {
      logger.error('Audit Verification Exception', { error: err.message, userId });
      throw err;
    }
  }
}

module.exports = new AuditService();
