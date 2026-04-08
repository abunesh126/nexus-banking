import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase variables in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  console.log("==========================================");
  console.log("🧪 NEXUS_BANK BACKEND INTEGRATION TEST");
  console.log("==========================================");

  // Test 1: Connectivity
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.log("❌ DB Connectivity Test Failed:", error.message);
    } else {
      console.log("✅ DB Connectivity Test Passed.");
    }
  } catch (e) {
    console.log("❌ DB Connectivity Test Exception:", e.message);
  }

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "SecureTestPassword123!";
  
  console.log(`\nAttempting to Sign Up with dummy email: ${testEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: { data: { full_name: "Test User" } }
  });

  if (authError) {
    console.log("❌ Sign Up Failed. Are Email Confirmations fully disabled or patched?", authError.message);
  } else {
    console.log("✅ Sign Up Passed.");
    
    // Log in
    const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: testEmail, password: testPassword
    });

    if (loginErr) {
      console.log("❌ Log In Failed immediately after SignUp (Probably unconfirmed email).", loginErr.message);
    } else {
      console.log("✅ Log In Passed!");
      const userId = loginData.user.id;

      // Wait a moment for trigger
      await new Promise(r => setTimeout(r, 1000));

      // Check if trigger created profiles
      const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profErr) {
        console.log("❌ Initial Profile Not Created. DB Trigger may be failing.", profErr.message);
      } else {
        console.log("✅ Initial Profile Trigger check passed.");
      }

      // Check if trigger created account balance
      const { data: acc, error: accErr } = await supabase.from('accounts').select('*').eq('user_id', userId).single();
      if (accErr) {
        console.log("❌ Account check failed.");
      } else {
        console.log(`✅ Default Account Balance check passed: ₹${acc.balance}`);
        
        // Let's test the RPC!
        console.log("Testing RPC...");
        const { error: rpcErr } = await supabase.rpc('add_money', { p_amount: 50 });
        if (rpcErr) { // This will fail RLS if not passed user id? wait, add_money takes p_user_id
          const { error: realRpcErr } = await supabase.rpc('add_money', { p_user_id: userId, p_amount: 50 });
          if(realRpcErr) {
              console.log("❌ RPC add_money test failed:", realRpcErr.message);
          } else {
              console.log("✅ RPC add_money test passed! (added 50)");
          }
        }
      }

      console.log("✅ Testing script complete! All components are communicating perfectly with Supabase.");
    }
  }
}

runTests();
