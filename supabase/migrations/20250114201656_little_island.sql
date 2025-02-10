-- Drop existing function first
DROP FUNCTION IF EXISTS sync_user_and_wallet(text);

-- Recreate function with new return type
CREATE OR REPLACE FUNCTION sync_user_and_wallet(user_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record record;
  v_uuid uuid;
  v_username text;
  v_counter integer := 0;
  v_wallet_id uuid;
BEGIN
  -- Convert user_id to UUID
  BEGIN
    v_uuid := CASE 
      WHEN user_id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_generate_v4(), user_id)
      ELSE
        CASE 
          WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN user_id::uuid
          ELSE uuid_generate_v5(uuid_generate_v4(), user_id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    v_uuid := uuid_generate_v5(uuid_generate_v4(), user_id);
  END;

  -- Check if user exists
  SELECT * INTO v_user_record FROM users WHERE id = v_uuid;
  
  IF NOT FOUND THEN
    -- Generate base username
    v_username := 'user_' || substr(md5(v_uuid::text), 1, 8);

    -- Try to create user with unique username
    LOOP
      BEGIN
        INSERT INTO users (
          id,
          username,
          created_at,
          updated_at
        ) VALUES (
          v_uuid,
          CASE 
            WHEN v_counter = 0 THEN v_username
            ELSE v_username || '_' || v_counter::text
          END,
          now(),
          now()
        );
        EXIT; -- Exit loop if insert succeeds
      EXCEPTION 
        WHEN unique_violation THEN
          IF v_counter >= 10 THEN
            -- After 10 attempts, use timestamp
            INSERT INTO users (
              id,
              username,
              created_at,
              updated_at
            ) VALUES (
              v_uuid,
              v_username || '_' || floor(extract(epoch from now())),
              now(),
              now()
            );
            EXIT;
          END IF;
          v_counter := v_counter + 1;
          CONTINUE;
        WHEN OTHERS THEN
          RAISE WARNING 'Error creating user: %', SQLERRM;
          RETURN NULL;
      END;
    END LOOP;
  END IF;

  -- Create wallet if not exists and get wallet ID
  INSERT INTO wallets (user_id, balance)
  VALUES (v_uuid, 10000)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in sync_user_and_wallet: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION sync_user_and_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_and_wallet(text) TO anon;