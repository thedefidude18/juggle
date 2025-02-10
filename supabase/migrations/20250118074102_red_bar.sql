-- Create function to sync user and wallet
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id bigint;
BEGIN
  -- Create wallet if not exists
  INSERT INTO wallets (user_id, balance)
  VALUES (user_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;

-- Function to sync user and wallet
CREATE OR REPLACE FUNCTION sync_user_and_wallet_v2(input_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
BEGIN
  -- Convert input_id to UUID
  BEGIN
    v_user_id := CASE 
      WHEN input_id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_generate_v4(), input_id)
      ELSE
        input_id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := uuid_generate_v5(uuid_generate_v4(), input_id);
  END;

  -- Create wallet if not exists
  INSERT INTO wallets (user_id, balance)
  VALUES (v_user_id, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$;