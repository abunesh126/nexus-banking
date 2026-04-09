const { supabaseAdmin } = require('../lib/supabaseAdmin');
const logger = require('../utils/logger');

/**
 * Alert Service
 * Standardizes NexusBank response to security incidents.
 */
class AlertService {
  /**
   * Handle incoming security events based on severity tiers
   */
  async handleSecurityEvent(event) {
    const { type, severity, userId, metadata = {} } = event;

    try {
      // 1. Permanent Forensic Log
      await supabaseAdmin.from('security_events').insert([{
        event_type: type,
        severity: severity,
        user_id: userId,
        metadata
      }]);

      switch (severity) {
        case 'LOW':
          logger.info(`Security Incident [LOW]: ${type}`, { userId });
          break;

        case 'MEDIUM':
          logger.warn(`Security Incident [MEDIUM]: ${type}`, { userId, metadata });
          this.alertAdmin(event);
          break;

        case 'HIGH':
          logger.error(`Security Incident [HIGH]: ${type}`, { userId, metadata });
          await this.restrictUser(userId, type);
          this.alertAdmin(event);
          break;

        case 'CRITICAL':
          logger.error(`🚨 CRITICAL SECURITY BREACH: ${type}`, { userId, metadata });
          await this.activateSystemLock(type, metadata);
          this.alertAdmin(event);
          break;
      }
    } catch (err) {
      logger.error('Alert Service Processing Failure', { error: err.message });
    }
  }

  async restrictUser(userId, reason) {
    if (!userId) return;
    await supabaseAdmin.from('profiles').update({ 
      blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h block
    }).eq('id', userId);
    logger.warn(`User ${userId} restricted due to ${reason}`);
  }

  async activateSystemLock(reason, metadata) {
    // 1. Set Global Kill Switch
    await supabaseAdmin
      .from('system_config')
      .update({ value: { active: true, reason, triggered_at: new Date().toISOString() } })
      .eq('key', 'system_lock');

    // 2. Log to State History
    await supabaseAdmin.from('system_state_history').insert([{
      state: 'LOCKED',
      trigger_reason: reason,
      severity: 'CRITICAL',
      metadata
    }]);

    logger.error('🛑 GLOBAL SYSTEM LOCK ACTIVATED');
  }

  alertAdmin(event) {
    // Mock for Email/SMS/Dashboard broadcast
    console.log(`\n[ADMIN_ALERT] ${event.severity} - ${event.type}\nPayload: ${JSON.stringify(event.metadata)}\n`);
  }
}

module.exports = new AlertService();
