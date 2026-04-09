const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

/**
 * @route   GET /api/audit/verify/:userId
 * @desc    Cryptographically verify the forensic chain for a specific user
 * @access  Private (Manager Only)
 */
router.get('/verify/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // 1. RBAC CHECK: Only Managers/Admins can verify chains
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
      logger.error('Unauthorized Chain Verification Attempt', { userId: req.user.id });
      return res.status(403).json({ error: 'High-security privilege required' });
    }

    // 2. Perform Verification
    const result = await auditService.verifyChain(targetUserId);

    if (!result.valid) {
      // 3. LOG CRITICAL SECURITY EVENT ON TAMPER DETECTION
      await supabaseAdmin.from('security_events').insert([{
        event_type: 'AUDIT_CHAIN_BREACH',
        severity: 'CRITICAL',
        user_id: targetUserId,
        metadata: { 
          reason: result.reason, 
          brokenAt: result.brokenAt,
          detectedBy: req.user.id 
        }
      }]);

      return res.status(418).json({
        integrity: 'COMPROMISED',
        ...result
      });
    }

    res.json({
      integrity: 'VERIFIED',
      logCount: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Audit Verification Error', { error: err.message });
    res.status(500).json({ error: 'Integrity scan failed' });
  }
});

module.exports = router;
