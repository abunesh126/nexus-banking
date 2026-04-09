const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const storeService = require('../services/storeService');
const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   GET /api/transactions/challenge
 * @desc    Issue a single-use nonce for transaction integrity
 */
router.get('/challenge', authMiddleware, async (req, res) => {
    try {
        const nonce = uuidv4();
        // Bind nonce to user session for 60s
        storeService.tokenCache.set(`txn_nonce:${req.user.id}`, nonce, 60);

        res.json({ nonce });
    } catch (err) {
        logger.error('Transaction Challenge Failure', { error: err.message });
        res.status(500).json({ error: 'Failed to issue security nonce' });
    }
});

/**
 * @route   POST /api/transactions/transfer
 * @desc    Execute a secure P2P transfer with full integrity checks
 */
router.post('/transfer', authMiddleware, async (req, res) => {
    const { fromAccount, toAccount, amount, currency, nonce, timestamp, idempotencyKey } = req.body;

    try {
        // 1. REPLAY PROTECTION: Verify and consume nonce
        const savedNonce = storeService.tokenCache.get(`txn_nonce:${req.user.id}`);
        if (!savedNonce || savedNonce !== nonce) {
            await logSecurityEvent(req.user.id, 'REPLAY_ATTEMPT', 'HIGH', { nonce });
            return res.status(403).json({ error: 'Invalid or expired nonce' });
        }
        storeService.tokenCache.del(`txn_nonce:${req.user.id}`);

        // 2. IDEMPOTENCY: Check for duplicate request
        const cachedResult = storeService.getIdempotency(idempotencyKey);
        if (cachedResult) {
            return res.json({ ...cachedResult, message: 'Already processed' });
        }

        // 3. ANTI-DELAY: Validate timestamp (60s window)
        if (Math.abs(Date.now() - timestamp) > 60000) {
            return res.status(403).json({ error: 'Request expired (Clock drift or Delay Attack)' });
        }

        // 4. RATE LIMITING: Prevent automated draining
        if (!storeService.validateTransactionRate(req.user.id)) {
            return res.status(429).json({ error: 'Transaction limit reached. Wait 60s.' });
        }

        // 5. DAILY LIMIT CHECK (Phase 7)
        const dailyTotal = storeService.tokenCache.get(`daily_total:${req.user.id}`) || 0;
        if (dailyTotal + amount > 200000) {
            return res.status(403).json({ error: 'Daily transaction limit (₹200,000) exceeded.' });
        }

        // 6. STEP-UP MFA (Phase 7 - High Risk Only)
        const isHighRisk = amount > 50000;
        const mfaAge = Date.now() - (req.session.mfa_verified_at || 0);
        if (isHighRisk && mfaAge > 5 * 60 * 1000) { // 5-minute fresh MFA required
            return res.status(403).json({ 
                error: true, 
                step_up_required: true,
                message: 'High-risk transaction requires fresh MFA verification.' 
            });
        }

        // 7. EXECUTE: Atomic P2P Movement
        const result = await transactionService.processTransfer(req.user.id, {
            fromAccount,
            toAccount,
            amount,
            currency,
            nonce,
            timestamp,
            idempotencyKey,
            fingerprint: req.headers['x-fingerprint'] // Passed from middleware
        });

        // 8. UPDATE DAILY TOTAL
        storeService.tokenCache.set(`daily_total:${req.user.id}`, dailyTotal + amount, 86400);

        // 9. CACHE RESULT: For idempotency
        storeService.saveIdempotency(idempotencyKey, result);

        res.json(result);

    } catch (err) {
        logger.error('Transaction Processing Error', { error: err.message, userId: req.user.id });
        res.status(500).json({ error: err.message || 'Ledger Integration Failure' });
    }
});

/**
 * @route   GET /api/transactions/verify/:id
 * @desc    Public verification of transaction receipt (Non-Repudiation)
 */
router.get('/verify/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: txn } = await require('../lib/supabaseAdmin').supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (!txn) return res.status(404).json({ error: 'Transaction not found' });

        // Re-verify integrity hash
        const expectedHash = transactionService.calculateIntegrityHash({
            userId: txn.user_id,
            fromAccount: txn.user_id, // Simplified for this view
            toAccount: txn.merchant,
            amount: txn.amount,
            currency: txn.currency,
            nonce: txn.nonce,
            timestamp: txn.created_at, // Use stored values
            idempotencyKey: txn.idempotency_key
        });

        const isValid = txn.integrity_hash === expectedHash;

        res.json({
            transaction_id: txn.id,
            status: txn.status,
            verified: isValid,
            signatures: {
                receipt: txn.receipt_signature,
                integrity: txn.integrity_hash
            },
            timestamp: txn.created_at
        });
    } catch (err) {
        res.status(500).json({ error: 'Verification Engine Offline' });
    }
});

async function logSecurityEvent(userId, type, severity, metadata = {}) {
    // Shared utility for logging tamper attempts
    const { supabaseAdmin } = require('../lib/supabaseAdmin');
    await supabaseAdmin.from('security_events').insert([{
        event_type: type,
        severity: severity,
        user_id: userId,
        metadata
    }]);
}

module.exports = router;
