const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

/**
 * Supabase Admin Client
 * ⚠️ NEVER expose this to the frontend.
 * This client uses the service_role key to bypass RLS.
 * Use only for: audit logs, security events, and privileged system tasks.
 */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabaseAdmin };
