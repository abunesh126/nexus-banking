// This script uses dynamic imports to avoid top-level ESM errors
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log("Testing Supabase connectivity...");
    
    // 1. Try to fetch a user
    const { data: users, error: dbErr } = await supabase.from('profiles').select('*').limit(1);
    if(dbErr) {
        console.error("DB Error:", dbErr);
    } else {
        console.log("DB Profiles fetched successfully:", users.length, "profiles exist.");
    }
  } catch(e) {
    console.error("Test framework error:", e);
  }
}
run();
