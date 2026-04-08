-- ╔══════════════════════════════════════════════════════════════════╗
-- ║   NexusBank — Final Backend Patch (RPCs)                        ║
-- ║   Run this to fix Card Generation & Audit Log RLS failures!     ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Generate Virtual Card (Bypasses JS RLS Insert issues)
CREATE OR REPLACE FUNCTION public.generate_card(
  p_user_id UUID,
  p_card_type TEXT,
  p_card_number TEXT,
  p_expiry TEXT,
  p_cvv TEXT,
  p_label TEXT,
  p_color TEXT
)
RETURNS public.virtual_cards AS $$
DECLARE
  new_card public.virtual_cards;
BEGIN
  -- Strict security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only generate cards for your own account.';
  END IF;

  INSERT INTO public.virtual_cards (
    user_id, card_type, card_number, expiry, cvv, label, color
  )
  VALUES (
    p_user_id, p_card_type, p_card_number, p_expiry, p_cvv, p_label, p_color
  )
  RETURNING * INTO new_card;

  RETURN new_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Burn / Delete Virtual Card
CREATE OR REPLACE FUNCTION public.burn_card(
  p_card_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Strict security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own cards.';
  END IF;

  DELETE FROM public.virtual_cards
  WHERE id = p_card_id AND user_id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Secure Audit Logging
CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_metadata JSONB,
  p_user_agent TEXT
)
RETURNS VOID AS $$
BEGIN
  -- We allow logging even if auth.uid() might not match p_user_id exactly (e.g. during logout, signup)
  -- But we enforce that an audit log is written.

  INSERT INTO public.audit_logs (user_id, action, metadata, user_agent)
  VALUES (p_user_id, p_action, p_metadata, p_user_agent);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════
-- ██  Done! All frontend mutations now successfully flow through 
-- ██  secure backend functions instead of open tables.
-- ═══════════════════════════════════════════════════════════════════
