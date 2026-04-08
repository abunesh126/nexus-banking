import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://byxomxbpyekzchewidgl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eG9teGJweWVremNoZXdpZGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTUzMTMsImV4cCI6MjA5MTE5MTMxM30.55SAm3mKIRULqseVHxYgFHGBnc8vCVTnyBtNY1woUfA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fullDiagnostic() {
  const email = `diag_${Date.now()}@example.com`;
  const password = "Password123!";

  console.log(`[1] Signing up user: ${email}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password, options: { data: { full_name: "Diagnostic User" } }
  });

  if (authError) {
    console.log("❌ SignUp failed:", authError.message);
    return;
  }
  
  // Try logging in to get the session (if email confirmations are enabled, this fails unless the patch was applied)
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    console.log("❌ Login failed (Email confirm patch may not have worked on new users or is disabled):", loginError.message);
    return;
  }

  const userId = loginData.user.id;
  console.log(`✅ Logged in successfully! User ID: ${userId}`);

  // Fetch all user context sequentially
  console.log("[2] Checking user profiles, accounts, rewards...");
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log(" -> Profile Exists?", !!profile);

  const { data: account } = await supabase.from('accounts').select('*').eq('user_id', userId).single();
  console.log(" -> Account Exists?", !!account, account ? `Balance: ${account.balance}` : "");

  const { data: rewards } = await supabase.from('rewards').select('*').eq('user_id', userId).single();
  console.log(" -> Rewards Exists?", !!rewards, rewards ? `Points: ${rewards.total_points}` : "");

  if (!account || !rewards) {
     console.log("❌ DB Triggers for onboarding failed! The user missing required tables.");
     return;
  }

  console.log("[3] Testing add_money RPC...");
  const { data: newBalance, error: addErr } = await supabase.rpc('add_money', {
    p_user_id: userId,
    p_amount: 50.0
  });

  if (addErr) console.log("❌ add_money RPC Error:", addErr.message);
  else console.log(`✅ add_money RPC Response (New Balance expected = 50 or 124550):`, newBalance);

  console.log("[4] Testing log_transaction RPC...");
  const { data: newTxn, error: logErr } = await supabase.rpc('log_transaction', {
    p_user_id: userId,
    p_type: 'credit', p_title: 'Test', p_merchant: 'Test', p_amount: 50.0,
    p_category: 'Income', p_icon: '💳', p_risk_score: 0, p_note: 'test log'
  });

  if(logErr) console.log("❌ log_transaction RPC Error:", logErr.message);
  else console.log(`✅ log_transaction RPC Succeded. Transaction ID:`, newTxn?.id);
  
  console.log("[5] Done.");
}

fullDiagnostic();
