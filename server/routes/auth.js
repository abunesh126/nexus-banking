const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const storeService = require('../services/storeService');
const mfaService = require('../services/mfaService');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const logger = require('../utils/logger');

/**
 * @route   GET /api/auth/mfa/setup
 * @desc    Generate a new TOTP secret (Initial Stage)
 */
router.get('/mfa/setup', authMiddleware, async (req, res) => {
  try {
    const { secret, qrCodeData } = await mfaService.generateSecret(req.user.email);
    
    // Store temporary secret for enrollment (2 min)
    storeService.tokenCache.set(`SETUP_${req.user.id}`, secret, 120);

    res.json({ qrCodeData });
  } catch (err) {
    logger.error('MFA Setup Failure', { error: err.message });
    res.status(500).json({ error: 'Failed to initialize MFA setup' });
  }
});

/**
 * @route   POST /api/auth/mfa/enroll
 * @desc    Verify first token, permanently enable MFA, and generate backup codes
 */
router.post('/mfa/enroll', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const tempSecret = storeService.tokenCache.get(`SETUP_${req.user.id}`);

    if (!tempSecret) {
      return res.status(400).json({ error: 'Setup session expired. Restart enrollment.' });
    }

    const isValid = await mfaService.verifyToken(code, tempSecret);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // 1. Generate Backup Codes & Fingerprint
    const backupCodes = mfaService.generateBackupCodes();
    const encryptedBackup = await mfaService.encryptBackupCodes(backupCodes);
    const encryptedSecret = await mfaService.encryptSecret(tempSecret);
    const fingerprint = mfaService.getFingerprintHash(req.ip, req.headers['user-agent']);
    
    // 2. Persist to DB
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        totp_secret: encryptedSecret,
        mfa_enabled: true,
        fingerprint_hash: fingerprint,
        last_ip: req.ip,
        last_user_agent: req.headers['user-agent'],
        backup_codes: encryptedBackup
      })
      .eq('id', req.user.id);

    if (error) throw error;

    // 3. Clear temp storage
    storeService.tokenCache.del(`SETUP_${req.user.id}`);

    res.json({ 
      success: true, 
      backup_codes: backupCodes, // Shown once to user
      message: 'MFA Enrolled and Fingerprinted' 
    });
  } catch (err) {
    logger.error('MFA Enrollment Failure', { error: err.message });
    res.status(500).json({ error: 'Failed to complete MFA enrollment' });
  }
});

/**
 * @route   POST /api/auth/mfa/verify
 * @desc    Verify TOTP or Backup Code with Brute-Force protection
 */
router.post('/mfa/verify', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    // 1. BRUTE-FORCE PROTECTION (5 attempts / 5 mins)
    const attempts = storeService.incrementMfaAttempts(req.user.id);
    if (attempts > 5) {
      await logMfaEvent(req.user.id, 'MFA_LOCKOUT', 'HIGH', { attempts });
      return res.status(429).json({ error: 'Too many attempts. Locked for 5 minutes.' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile.mfa_enabled) {
      return res.status(403).json({ error: 'MFA not enrolled' });
    }

    let isValid = false;

    // 2. CHECK TOTP
    const secret = await mfaService.decryptSecret(profile.totp_secret);
    isValid = await mfaService.verifyToken(code, secret);

    // 3. CHECK BACKUP CODES IF TOTP FAILS
    if (!isValid && profile.backup_codes) {
        const codes = await mfaService.decryptBackupCodes(profile.backup_codes);
        const codeIndex = codes.indexOf(code);
        
        if (codeIndex !== -1) {
            isValid = true;
            // Remove used backup code
            codes.splice(codeIndex, 1);
            const newEncryptedBackup = await mfaService.encryptBackupCodes(codes);
            await supabaseAdmin.from('profiles').update({ backup_codes: newEncryptedBackup }).eq('id', req.user.id);
            logger.info('MFA Recovery Code Used', { userId: req.user.id });
        }
    }

    if (!isValid) {
      await logMfaEvent(req.user.id, 'MFA_FAILURE', 'MEDIUM', { code_length: code.length });
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // 4. IDENTITY SUCCESS FLOW
    storeService.resetMfaAttempts(req.user.id);
    storeService.setMfaSession(req.user.id);
    const revealToken = storeService.generateRevealToken(req.user.id);

    // Refresh Fingerprint (Risk-Based Update)
    const newFingerprint = mfaService.getFingerprintHash(req.ip, req.headers['user-agent']);
    await supabaseAdmin
      .from('profiles')
      .update({
        fingerprint_hash: newFingerprint,
        last_ip: req.ip,
        last_user_agent: req.headers['user-agent']
      })
      .eq('id', req.user.id);

    await logMfaEvent(req.user.id, 'MFA_SUCCESS', 'LOW');

    res.json({
      success: true,
      reveal_token: revealToken
    });
  } catch (err) {
    logger.error('MFA Verification Failure', { error: err.message });
    res.status(500).json({ error: 'Internal Identity Failure' });
  }
});

async function logMfaEvent(userId, type, severity, metadata = {}) {
  await supabaseAdmin.from('security_events').insert([{
    event_type: type,
    severity: severity,
    user_id: userId,
    metadata: { ...metadata, timestamp: new Date().toISOString() }
  }]).select();
}

module.exports = router;
