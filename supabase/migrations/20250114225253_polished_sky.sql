-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update their challenges" ON challenges;

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid REFERENCES users(id) ON DELETE CASCADE,
  challenged_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount >= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'expired')),
  winner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  CONSTRAINT different_users CHECK (challenger_id != challenged_id)
);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own challenges"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (
    challenger_id = auth.uid()::uuid OR 
    challenged_id = auth.uid()::uuid
  );

CREATE POLICY "Users can create challenges"
  ON challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = auth.uid()::uuid);

CREATE POLICY "Users can update their challenges"
  ON challenges
  FOR UPDATE
  TO authenticated
  USING (
    challenger_id = auth.uid()::uuid OR 
    challenged_id = auth.uid()::uuid
  );

-- Create function to handle challenge responses
CREATE OR REPLACE FUNCTION handle_challenge_response(
  challenge_id uuid,
  accepted boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge record;
  v_challenger_wallet_id bigint;
  v_challenged_wallet_id bigint;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM challenges
  WHERE id = challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_challenge.status != 'pending' THEN
    RAISE EXCEPTION 'Challenge is no longer pending';
  END IF;

  IF v_challenge.expires_at < now() THEN
    UPDATE challenges
    SET status = 'expired'
    WHERE id = challenge_id;
    RETURN false;
  END IF;

  -- Get wallet IDs
  SELECT id INTO v_challenger_wallet_id
  FROM wallets
  WHERE user_id = v_challenge.challenger_id;

  SELECT id INTO v_challenged_wallet_id
  FROM wallets
  WHERE user_id = v_challenge.challenged_id;

  IF accepted THEN
    -- Check if challenged user has sufficient funds
    IF NOT EXISTS (
      SELECT 1 FROM wallets 
      WHERE id = v_challenged_wallet_id 
      AND balance >= v_challenge.amount
    ) THEN
      RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Lock funds from both users
    UPDATE wallets
    SET balance = balance - v_challenge.amount
    WHERE id IN (v_challenger_wallet_id, v_challenged_wallet_id);

    -- Update challenge status
    UPDATE challenges
    SET status = 'accepted'
    WHERE id = challenge_id;
  ELSE
    -- Update challenge status to declined
    UPDATE challenges
    SET status = 'declined'
    WHERE id = challenge_id;
  END IF;

  RETURN true;
END;
$$;

-- Create function to complete challenge
CREATE OR REPLACE FUNCTION complete_challenge(
  challenge_id uuid,
  winner_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge record;
  v_winner_wallet_id bigint;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM challenges
  WHERE id = challenge_id
  AND status = 'accepted'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found or not accepted';
  END IF;

  -- Verify winner is a participant
  IF winner_id NOT IN (v_challenge.challenger_id, v_challenge.challenged_id) THEN
    RAISE EXCEPTION 'Invalid winner';
  END IF;

  -- Get winner's wallet
  SELECT id INTO v_winner_wallet_id
  FROM wallets
  WHERE user_id = winner_id;

  -- Transfer total pot to winner
  UPDATE wallets
  SET balance = balance + (v_challenge.amount * 2)
  WHERE id = v_winner_wallet_id;

  -- Update challenge status
  UPDATE challenges
  SET 
    status = 'completed',
    winner_id = winner_id,
    completed_at = now()
  WHERE id = challenge_id;

  -- Create notification for winner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata
  ) VALUES (
    winner_id,
    'challenge_win',
    'Challenge Won!',
    'You won the P2P challenge and earned ₦' || (v_challenge.amount * 2)::text,
    jsonb_build_object(
      'challenge_id', challenge_id,
      'amount', v_challenge.amount * 2
    )
  );

  RETURN true;
END;
$$;

-- Create function to handle expired challenges
CREATE OR REPLACE FUNCTION handle_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE challenges
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged_id ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON challenges(expires_at);