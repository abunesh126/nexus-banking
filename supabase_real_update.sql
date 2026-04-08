-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   NexusBank — REAL MODE UPDATE (Run in Supabase SQL Editor)      ║
-- ║   This updates the signup trigger to use real, empty accounts    ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
  base_cibil INTEGER;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Create initials for avatar
  user_avatar := UPPER(LEFT(user_name, 2));

  -- Generate a realistic starting CIBIL score for a new customer
  -- Random between 650 and 780
  base_cibil := FLOOR(RANDOM() * (780 - 650 + 1)) + 650;

  -- 1. Create profile
  INSERT INTO public.profiles (id, full_name, email, phone, avatar, role, cibil_score)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    user_avatar,
    'customer',
    base_cibil
  );

  -- 2. Create bank account with ZERO balance (Real Mode)
  INSERT INTO public.accounts (user_id, balance, account_number)
  VALUES (
    NEW.id,
    0.00,
    'NEXUS' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0')
  );

  -- 3. Create rewards record with ZERO points
  INSERT INTO public.rewards (user_id, total_points, earned_this_month, redeemed, expiring_soon, tier)
  VALUES (NEW.id, 0, 0, 0, 0, 'Bronze');

  -- 4. Create primary debit card
  INSERT INTO public.virtual_cards (user_id, card_type, card_number, expiry, cvv, label, color)
  VALUES (
    NEW.id,
    'MAIN',
    '4292 ' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    '12/29',
    LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
    'Primary Debit',
    'bg-primary'
  );

  -- 5. Initial audit log
  INSERT INTO public.audit_logs (user_id, action, metadata)
  VALUES (NEW.id, 'USER_REGISTERED', jsonb_build_object('email', NEW.email, 'method', 'supabase_auth'));

  -- NOTE: We NO LONGER generate mock transactions.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════
-- ██  ADD MONEY RPC FUNCTION
-- ═══════════════════════════════════════════════════════════════════
-- Necessary for "Real Mode" testing since users start with zero balance.

CREATE OR REPLACE FUNCTION public.add_money(p_user_id UUID, p_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  current_balance DECIMAL;
  new_balance DECIMAL;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Lock the row for update
  SELECT balance INTO current_balance
  FROM public.accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Account not found for user %', p_user_id;
  END IF;

  new_balance := current_balance + p_amount;

  UPDATE public.accounts
  SET balance = new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
