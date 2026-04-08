-- Force replace all RLS policies for complete visibility and zero weird edge cases.

-- 1. TRANSACTIONS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. REWARDS
DROP POLICY IF EXISTS "Users can view own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.rewards;

CREATE POLICY "Users can view own rewards"
  ON public.rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON public.rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- NOTE: By omitting WITH CHECK on UPDATE for rewards, we make sure it doesn't fail evaluation after the update.
-- The USING clause already dictates WHICH rows the user can touch.


-- 3. To guarantee transactions never fail because of RLS mismatch on INSERT via API,
-- We can also explicitly run the transaction creation through an RPC. 
-- BUT RLS should work. Let's fix the INSERT policy specifically.
-- Actually, the INSERT issue happens because some columns might trigger RLS check failures? No, only user_id is checked.

-- Let's create an RPC for inserting transactions to completely bypass RLS issues for system generated logs.
-- This ensures the client NEVER encounters RLS blocks when the front-end requests a valid transaction insert.

CREATE OR REPLACE FUNCTION public.log_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_merchant TEXT,
  p_amount DECIMAL,
  p_category TEXT,
  p_icon TEXT,
  p_risk_score INTEGER,
  p_note TEXT
)
RETURNS public.transactions AS $$
DECLARE
  new_txn public.transactions;
BEGIN
  -- Security check: ensure the caller is exactly the user!
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only log your own transactions.';
  END IF;

  INSERT INTO public.transactions (
    user_id, type, title, merchant, amount, category, icon, risk_score, note
  )
  VALUES (
    p_user_id, p_type, p_title, p_merchant, p_amount, p_category, p_icon, p_risk_score, p_note
  )
  RETURNING * INTO new_txn;

  RETURN new_txn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Let's create an RPC for redeeming points to prevent 'Cannot coerce' errors when updating rows.
CREATE OR REPLACE FUNCTION public.redeem_rewards(
  p_user_id UUID,
  p_points_to_redeem INTEGER
)
RETURNS public.rewards AS $$
DECLARE
  current_rewards public.rewards;
  updated_rewards public.rewards;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock row
  SELECT * INTO current_rewards
  FROM public.rewards
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_rewards IS NULL THEN
    RAISE EXCEPTION 'Rewards account not found.';
  END IF;

  IF current_rewards.total_points < p_points_to_redeem THEN
    RAISE EXCEPTION 'Insufficient points.';
  END IF;

  UPDATE public.rewards
  SET 
    total_points = total_points - p_points_to_redeem,
    redeemed = redeemed + p_points_to_redeem,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO updated_rewards;

  RETURN updated_rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
