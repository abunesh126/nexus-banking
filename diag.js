import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://byxomxbpyekzchewidgl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eG9teGJweWVremNoZXdpZGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTUzMTMsImV4cCI6MjA5MTE5MTMxM30.55SAm3mKIRULqseVHxYgFHGBnc8vCVTnyBtNY1woUfA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log("Fetching profiles to check DB connection...");
  const { data: profiles, error } = await supabase.from('profiles').select('*').limit(3);
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  console.log(`Found ${profiles.length} profiles.`);
  
  if (profiles.length === 0) {
      console.log("Database looks empty. No users created successfully with triggers.");
      return;
  }

  const userId = profiles[0].id;
  console.log(`Testing with user_id: ${userId}`);
  
  console.log("Checking accounts...:");
  const { data: acc } = await supabase.from('accounts').select('*').eq('user_id', userId).single();
  console.log("Account balance:", acc ? acc.balance : "NOT FOUND");

  console.log("Checking rewards...:");
  const { data: rwd } = await supabase.from('rewards').select('*').eq('user_id', userId).single();
  console.log("Rewards points:", rwd ? rwd.total_points : "NOT FOUND");
  
  console.log("Checking transactions...:");
  const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', userId);
  console.log(`Found ${txns?.length || 0} transactions.`);
  
  console.log("====================================================");
  console.log("If account, rewards, or transactions are missing, the Supabase trigger handle_new_user failed during account signup.");
  console.log("If they are present but UI isn't updating, the frontend state management (BankContext) might be stale, or RPCs might be swallowing data.");
}

testSupabase();
