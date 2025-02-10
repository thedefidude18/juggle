-- Add coin bonus history table
CREATE TABLE IF NOT EXISTS coin_bonus_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  amount integer NOT NULL CHECK (amount > 0),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coin_bonus_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view bonus history"
  ON coin_bonus_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  ));

-- Function to disburse coins bonus
CREATE OR REPLACE FUNCTION disburse_coins_bonus(
  p_admin_id uuid,
  p_amount integer,
  p_reason text DEFAULT 'Admin bonus'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_user record;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = p_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can disburse bonuses';
  END IF;

  -- Record bonus distribution
  INSERT INTO coin_bonus_history (admin_id, amount, reason)
  VALUES (p_admin_id, p_amount, p_reason);

  -- Update all user wallets
  UPDATE wallets
  SET 
    coins = coins + p_amount,
    updated_at = now();

  -- Create notifications for all users
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata
  )
  SELECT
    w.user_id,
    'bonus',
    'Coins Bonus Received! 🎉',
    'You have received ' || p_amount::text || ' Coins bonus!',
    jsonb_build_object(
      'amount', p_amount,
      'reason', p_reason,
      'admin_id', p_admin_id
    )
  FROM wallets w;

  -- Record admin action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_id,
    'disburse_bonus',
    'system',
    gen_random_uuid(),
    jsonb_build_object(
      'amount', p_amount,
      'reason', p_reason
    )
  );

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION disburse_coins_bonus(uuid, integer, text) TO authenticated;