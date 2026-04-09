const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminService = require('../services/adminService');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// 1. Strict Admin Rate Limiter (10 req / min)
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Admin API abuse detected. Cooldown active.' }
});

router.use(authMiddleware);
router.use(adminLimiter);

/**
 * @route   GET /api/admin/audit/export
 * @desc    Export HMAC-signed forensic audit logs for compliance
 */
router.get('/audit/export', async (req, res) => {
    try {
        // Enforce SuperAdmin Role check here
        const exportData = await adminService.exportAuditLogs();
        res.json(exportData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/admin/system/unlock
 * @desc    Perform forensic recovery and clear Global Kill Switch
 */
router.post('/system/unlock', async (req, res) => {
    try {
        // Enforce SuperAdmin Role check here
        const result = await adminService.performSystemRecovery(req.user.id);
        res.json(result);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

/**
 * @route   GET /api/admin/security/events
 * @desc    Fetch real-time security events and anomaly alerts
 */
router.get('/security/events', async (req, res) => {
    try {
        const eventsData = await adminService.getSecurityEvents();
        res.json(eventsData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
