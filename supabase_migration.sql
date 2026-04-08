-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   NexusBank — Complete Supabase Database Migration              ║
-- ║   Run this ENTIRE script in Supabase Dashboard → SQL Editor     ║
-- ║   Date: 2026-04-08                                              ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════
-- ██  1. PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'teller', 'manager', 'admin')),
  mfa_enabled BOOLEAN DEFAULT true,
  cibil_score INTEGER DEFAULT 762 CHECK (cibil_score >= 300 AND cibil_score <= 900),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════
-- ██  2. ACCOUNTS TABLE (Bank Balance)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 124500.00,
  currency TEXT DEFAULT 'INR',
  account_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ██  3. TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  title TEXT NOT NULL,
  merchant TEXT DEFAULT '',
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  category TEXT DEFAULT 'UPI',
  icon TEXT DEFAULT '📲',
  risk_score INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ██  4. VIRTUAL CARDS TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.virtual_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL DEFAULT 'MAIN' CHECK (card_type IN ('MAIN', 'BURNER')),
  card_number TEXT NOT NULL,
  expiry TEXT NOT NULL,
  cvv TEXT NOT NULL,
  label TEXT DEFAULT 'Primary Debit',
  color TEXT DEFAULT 'bg-primary',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON public.virtual_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cards"
  ON public.virtual_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON public.virtual_cards FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ██  5. REWARDS TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 4820,
  earned_this_month INTEGER DEFAULT 1540,
  redeemed INTEGER DEFAULT 500,
  expiring_soon INTEGER DEFAULT 200,
  tier TEXT DEFAULT 'Silver' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON public.rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON public.rewards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ██  6. AUDIT LOGS TABLE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ██  7. AUTO-SETUP TRIGGER (On User Signup)
-- ═══════════════════════════════════════════════════════════════════
-- When a user signs up via Supabase Auth, automatically create:
-- 1. A profile record
-- 2. A bank account with ₹1,24,500 starting balance
-- 3. A rewards record
-- 4. A primary debit card
-- 5. 10 mock transactions

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Create initials for avatar
  user_avatar := UPPER(LEFT(user_name, 2));

  -- 1. Create profile
  INSERT INTO public.profiles (id, full_name, email, phone, avatar, role)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    user_avatar,
    'customer'
  );

  -- 2. Create bank account with starting balance
  INSERT INTO public.accounts (user_id, balance, account_number)
  VALUES (
    NEW.id,
    124500.00,
    'NEXUS' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0')
  );

  -- 3. Create rewards record
  INSERT INTO public.rewards (user_id, total_points, earned_this_month, redeemed, expiring_soon, tier)
  VALUES (NEW.id, 4820, 1540, 500, 200, 'Silver');

  -- 4. Create primary debit card
  INSERT INTO public.virtual_cards (user_id, card_type, card_number, expiry, cvv, label, color)
  VALUES (
    NEW.id,
    'MAIN',
    '4292 ' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    '09/28',
    LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
    'Primary Debit',
    'bg-primary'
  );

  -- 5. Seed 10 mock transactions
  INSERT INTO public.transactions (user_id, type, title, merchant, amount, category, icon, created_at) VALUES
    (NEW.id, 'credit', 'Salary Credit',      'Infosys Ltd.',  124500, 'Income',        '💼', NOW() - INTERVAL '10 days'),
    (NEW.id, 'debit',  'Amazon Shopping',     'Amazon India',  3499,   'Shopping',      '🛒', NOW() - INTERVAL '11 days'),
    (NEW.id, 'debit',  'Electricity Bill',    'BESCOM',        1250,   'Bills',         '⚡', NOW() - INTERVAL '13 days'),
    (NEW.id, 'credit', 'Freelance Payment',   'Upwork Inc.',   18000,  'Income',        '💻', NOW() - INTERVAL '16 days'),
    (NEW.id, 'debit',  'Zomato Order',        'Zomato',        680,    'Food',          '🍔', NOW() - INTERVAL '17 days'),
    (NEW.id, 'debit',  'Netflix Subscription','Netflix',       649,    'Entertainment', '🎬', NOW() - INTERVAL '18 days'),
    (NEW.id, 'debit',  'Uber Ride',           'Uber India',    320,    'Travel',        '🚗', NOW() - INTERVAL '19 days'),
    (NEW.id, 'debit',  'Swiggy Instamart',    'Swiggy',        920,    'Food',          '🛍️', NOW() - INTERVAL '21 days'),
    (NEW.id, 'credit', 'Cashback Reward',     'NexusBank',     450,    'Rewards',       '🎁', NOW() - INTERVAL '23 days'),
    (NEW.id, 'debit',  'Airtel Recharge',     'Airtel',        399,    'Bills',         '📱', NOW() - INTERVAL '24 days');

  -- 6. Initial audit log
  INSERT INTO public.audit_logs (user_id, action, metadata)
  VALUES (NEW.id, 'USER_REGISTERED', jsonb_build_object('email', NEW.email, 'method', 'supabase_auth'));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════════
-- ██  8. DEDUCT BALANCE RPC (Atomic Operation)
-- ═══════════════════════════════════════════════════════════════════
-- Prevents race conditions when deducting balance.

CREATE OR REPLACE FUNCTION public.deduct_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  current_balance DECIMAL;
  new_balance DECIMAL;
BEGIN
  -- Lock the row for update
  SELECT balance INTO current_balance
  FROM public.accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Account not found for user %', p_user_id;
  END IF;

  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: ₹%', current_balance;
  END IF;

  new_balance := current_balance - p_amount;

  UPDATE public.accounts
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════
-- ██  9. UPDATED_AT AUTO-TRIGGER
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- ██  DONE! All tables, policies, triggers, and functions created.
-- ═══════════════════════════════════════════════════════════════════
