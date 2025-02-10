-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing function
DROP FUNCTION IF EXISTS initialize_user_wallet(text);

-- Create improved wallet initialization function with better UUID handling
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id bigint;
BEGIN
  -- Convert text ID to UUID with multiple fallback options
  BEGIN
    v_user_id := CASE 
      WHEN user_id LIKE 'did:privy:%' THEN 
        -- For Privy DIDs, create a deterministic UUID
        uuid_generate_v5(
          uuid_generate_v4(), -- Use as namespace
          substring(user_id from 11) -- Skip 'did:privy:' prefix
        )
      ELSE
        CASE 
          WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN user_id::uuid
          ELSE uuid_generate_v5(uuid_generate_v4(), user_id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback using v5 with a fixed namespace
    v_user_id := uuid_generate_v5(
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, -- Fixed namespace
      user_id
    );
  END;

  -- Create or update wallet with retries
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO wallets (user_id, balance)
      VALUES (v_user_id, 10000)
      ON CONFLICT (user_id) DO UPDATE
      SET updated_at = now()
      RETURNING id INTO v_wallet_id;

      -- If successful, return the wallet ID
      IF v_wallet_id IS NOT NULL THEN
        RETURN v_wallet_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN
        RAISE WARNING 'Error in initialize_user_wallet after 3 attempts: %', SQLERRM;
        RETURN NULL;
      END IF;
      -- Wait a bit before retrying with exponential backoff
      PERFORM pg_sleep(power(2, i - 1) * 0.1);
    END;
  END LOOP;

  RETURN NULL;
END;
$$;

-- Update user sync function to handle Privy DIDs consistently
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Convert ID to UUID with consistent handling
  BEGIN
    new_user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN 
        -- For Privy DIDs, create a deterministic UUID
        uuid_generate_v5(
          uuid_generate_v4(), -- Use as namespace
          substring(NEW.id from 11) -- Skip 'did:privy:' prefix
        )
      ELSE
        CASE 
          WHEN NEW.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN NEW.id::uuid
          ELSE uuid_generate_v5(uuid_generate_v4(), NEW.id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback using v5 with a fixed namespace
    new_user_id := uuid_generate_v5(
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, -- Fixed namespace
      NEW.id
    );
  END;

  -- Set base username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(new_user_id::text), 1, 8)
  );

  -- Try to find a unique username
  LOOP
    final_username := CASE 
      WHEN counter = 0 THEN base_username
      ELSE base_username || '_' || counter::text
    END;

    BEGIN
      INSERT INTO users (
        id,
        name,
        username,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        new_user_id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        final_username,
        COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new_user_id::text
        ),
        now(),
        now()
      );
      EXIT;
    EXCEPTION 
      WHEN unique_violation THEN
        IF counter >= 10 THEN
          -- After 10 attempts, use timestamp
          final_username := base_username || '_' || floor(extract(epoch from now()));
          
          INSERT INTO users (
            id,
            name,
            username,
            avatar_url,
            created_at,
            updated_at
          ) VALUES (
            new_user_id,
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            final_username,
            COALESCE(
              NEW.raw_user_meta_data->>'avatar_url',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new_user_id::text
            ),
            now(),
            now()
          );
          EXIT;
        END IF;
        counter := counter + 1;
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING 'Error in sync_user_profile: %', SQLERRM;
        RETURN NEW;
    END;
  END LOOP;

  -- Create wallet for new user
  BEGIN
    INSERT INTO wallets (user_id, balance)
    VALUES (new_user_id, 10000)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating wallet: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_wallet(text) TO anon;