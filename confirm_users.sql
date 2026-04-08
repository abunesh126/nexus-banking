-- Run this in your Supabase SQL Editor to instantly confirm all users!
-- By default, Supabase waits for email verification. This skips that.

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
