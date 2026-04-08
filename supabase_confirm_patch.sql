-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   NexusBank — Auto-Confirm Email Patch                          ║
-- ║   Run this to fix "Invalid credentials" on new signups!         ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Update existing users so you can log in right now!
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Automatically confirm ALL future signups at the database level
-- so you never have to change your Supabase Auth Settings.

CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();
