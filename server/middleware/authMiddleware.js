const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');
const logger = require('../utils/logger');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Auth Middleware
 * Verifies the presence and validity of the Supabase JWT.
 * Attaches the user object to the request.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // SESSION BINDING: Anti-Session Hijacking Check
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_ip, last_user_agent')
      .eq('id', user.id)
      .single();

    if (profile) {
      const currentIp = req.ip;
      const currentUA = req.headers['user-agent'];
      const currentHash = mfaService.getFingerprintHash(currentIp, currentUA);

      // 1. PERFECT MATCH: Standard flow
      if (profile.fingerprint_hash === currentHash) {
          req.authenticated_device = true;
      } 
      // 2. RISK-BASED EVALUATION (Elite Hardening)
      else if (profile.fingerprint_hash) {
          const uaMatch = profile.last_user_agent === currentUA;
          
          if (uaMatch) {
              // SOFT MISMATCH (Handover): Log and Allow
              logger.info('Identity Soft Mismatch (Handover)', { userId: user.id, ip: currentIp });
          } else {
              // STRICT MISMATCH (New Device): Flag for Re-MFA
              logger.error('Identity Strict Mismatch (New Device)', { userId: user.id, ip: currentIp });
              req.mfa_required = true; 
          }
      }
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth Middleware Exception', { error: err.message });
    res.status(500).json({ error: 'Internal Identity Failure' });
  }
};

module.exports = authMiddleware;
