-- Disable RLS temporarily for setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_all_wallet_operations" ON wallets;
DROP POLICY IF EXISTS "allow_all_user_operations" ON users;

-- Create public access policies
CREATE POLICY "public_users_access"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_wallets_access"
  ON wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO anon;

-- Update handle_new_user function to ensure user creation before wallet
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
  new_user_id uuid;
BEGIN
  -- Ensure we have a valid UUID for the user
  BEGIN
    new_user_id := NEW.id::uuid;
  EXCEPTION WHEN OTHERS THEN
    new_user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;

  -- Set base username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(new_user_id::text), 1, 8)
  );

  -- Try to find a unique username
  LOOP
    IF counter = 0 THEN
      final_username := base_username;
    ELSE
      final_username := base_username || '_' || counter;
    END IF;

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

      -- If user insert succeeds, create wallet
      INSERT INTO wallets (user_id, balance)
      VALUES (new_user_id, 10000)
      ON CONFLICT (user_id) DO NOTHING;

      EXIT; -- Exit loop if both operations succeed
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

          -- Create wallet after final username attempt
          INSERT INTO wallets (user_id, balance)
          VALUES (new_user_id, 10000)
          ON CONFLICT (user_id) DO NOTHING;

          EXIT;
        END IF;
        counter := counter + 1;
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to manually sync user and wallet
CREATE OR REPLACE FUNCTION sync_user_and_wallet(user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record record;
  v_uuid uuid;
BEGIN
  -- Convert user_id to UUID
  BEGIN
    v_uuid := user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_uuid := uuid_generate_v5(uuid_nil(), user_id);
  END;

  -- Check if user exists
  SELECT * INTO v_user_record FROM users WHERE id = v_uuid;
  
  IF NOT FOUND THEN
    -- Create user if not exists
    INSERT INTO users (
      id,
      username,
      created_at,
      updated_at
    ) VALUES (
      v_uuid,
      'user_' || substr(md5(v_uuid::text), 1, 8),
      now(),
      now()
    );
  END IF;

  -- Create wallet if not exists
  INSERT INTO wallets (user_id, balance)
  VALUES (v_uuid, 10000)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;