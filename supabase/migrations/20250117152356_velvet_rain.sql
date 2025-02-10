-- Create welcome_bonuses table to track bonus awards
CREATE TABLE IF NOT EXISTS welcome_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 1000,
  claimed_at timestamptz DEFAULT now(),
  referrer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT one_bonus_per_user UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE welcome_bonuses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own welcome bonus"
  ON welcome_bonuses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- Function to claim welcome bonus
CREATE OR REPLACE FUNCTION claim_welcome_bonus(
  p_user_id uuid,
  p_referrer_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id bigint;
  v_bonus_amount integer := 1000; -- Default bonus amount
BEGIN
  -- Check if user already claimed bonus
  IF EXISTS (SELECT 1 FROM welcome_bonuses WHERE user_id = p_user_id) THEN
    RETURN false;
  END IF;

  -- Get user's wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Start transaction
  BEGIN
    -- Add bonus to wallet
    UPDATE wallets
    SET balance = balance + v_bonus_amount
    WHERE id = v_wallet_id;

    -- Record bonus
    INSERT INTO welcome_bonuses (user_id, amount, referrer_id)
    VALUES (p_user_id, v_bonus_amount, p_referrer_id);

    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      metadata
    ) VALUES (
      p_user_id,
      'welcome_bonus',
      'Welcome Bonus Received! 🎉',
      'You received ₦1,000 welcome bonus points!',
      jsonb_build_object(
        'amount', v_bonus_amount,
        'referrer_id', p_referrer_id
      )
    );

    -- If referred, create notification for referrer
    IF p_referrer_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata
      ) VALUES (
        p_referrer_id,
        'referral_bonus',
        'New Referral! 🎉',
        'Someone joined using your referral!',
        jsonb_build_object(
          'referred_user_id', p_user_id
        )
      );
    END IF;

    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$;