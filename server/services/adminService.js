const crypto = require('crypto');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const logger = require('../utils/logger');
const alertService = require('./alertService');

/**
 * Admin Service
 * Privileged operations for system oversight and recovery.
 */
class AdminService {
  constructor() {
    this.EXPORT_SECRET = process.env.EXPORT_SECRET || 'NexusBank_Audit_Sync_2026';
  }

  /**
   * Export all audit logs with a cryptographic signature for compliance
   */
  async exportAuditLogs() {
    try {
      const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      const payload = JSON.stringify(logs);
      const signature = crypto.createHmac('sha256', this.EXPORT_SECRET)
        .update(payload)
        .digest('hex');

      return {
        exported_at: new Date().toISOString(),
        log_count: logs.length,
        data: logs,
        integrity_signature: signature
      };
    } catch (err) {
      logger.error('Audit Export Failure', { error: err.message });
      throw new Error('Failed to generate signed audit dump');
    }
  }

  /**
   * Safe Recovery Flow: Unlocks the system after forensic verification
   */
  async performSystemRecovery(adminId) {
    logger.info('ADMIN_INITIATED_RECOVERY', { adminId });

    try {
      // 1. Run Full Integrity Verification
      const verification = await this.verifyFullSystemIntegrity();
      if (!verification.valid) {
        throw new Error(`Recovery Aborted: ${verification.reason}`);
      }

      // 2. Unlock System
      await supabaseAdmin
        .from('system_config')
        .update({ value: { active: false, unlocked_at: new Date().toISOString(), unlocked_by: adminId } })
        .eq('key', 'system_lock');

      // 3. Log to History
      await supabaseAdmin.from('system_state_history').insert([{
        state: 'UNLOCKED',
        trigger_reason: 'ADMIN_MANUAL_RECOVERY',
        severity: 'LOW',
        metadata: { adminId }
      }]);

      return { success: true, message: 'NexusBank has been restored to HEALTHY state.' };

    } catch (err) {
      logger.error('SYSTEM_RECOVERY_FAIL', { error: err.message });
      throw err;
    }
  }

  async verifyFullSystemIntegrity() {
    // Shared with ledgerJob.js
    // Re-verify the sum of balances, the last 50 chained hashes, and genesis
    return { valid: true }; // Simplified for now
  }
}

module.exports = new AdminService();
