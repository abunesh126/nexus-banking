/**
 * Supabase Client — Single instance for the entire NexusBank application.
 * Uses VITE_ prefixed env vars which Vite auto-exposes to the client.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ SUPABASE CONFIG MISSING: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // FIX: Explicitly bypass the lock mechanism to prevent initialization timeouts
    lock: async (name, acquireTimeout, fn) => await fn(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
