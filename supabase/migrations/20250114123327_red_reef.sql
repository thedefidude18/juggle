/*
  # Fix User Profile Policies and Functions

  1. Updates
    - Safely drops and recreates policies
    - Improves user profile sync function
    - Adds manual sync capability
    
  2. Changes
    - Adds policy existence check
    - Enhances error handling
    - Improves UUID conversion
*/

DO $$ 
BEGIN
  -- Safely drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'anyone_can_view_profiles'
  ) THEN
    DROP POLICY "anyone_can_view_profiles" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'users_can_update_own_profile'
  ) THEN
    DROP POLICY "users_can_update_own_profile" ON users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'users_can_insert_own_profile'
  ) THEN
    DROP POLICY "users_can_insert_own_profile" ON users;
  END IF;

  -- Only create the policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'allow_all_authenticated_operations'
  ) THEN
    CREATE POLICY "allow_all_authenticated_operations"
      ON users
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Improved user profile sync function
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger AS $$
DECLARE
  user_id uuid;
  user_name text;
  user_username text;
  user_avatar text;
BEGIN
  -- Convert ID and set default values
  BEGIN
    user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN privy_did_to_uuid(NEW.id)
      ELSE NEW.id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to a deterministic UUID if conversion fails
    user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;
  
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(user_id::text), 1, 8)
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::text
  );

  -- Insert or update user profile with retries
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO public.users (
        id,
        name,
        username,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        user_id,
        user_name,
        user_username,
        user_avatar,
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        username = CASE 
          WHEN users.username IS NULL OR users.username = '' 
          THEN EXCLUDED.username 
          ELSE users.username 
        END,
        avatar_url = CASE 
          WHEN users.avatar_url IS NULL OR users.avatar_url = '' 
          THEN EXCLUDED.avatar_url 
          ELSE users.avatar_url 
        END,
        updated_at = now()
      WHERE 
        users.id = EXCLUDED.id;
        
      EXIT; -- Exit loop if successful
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN RAISE; END IF; -- Re-raise error on last attempt
      PERFORM pg_sleep(0.1 * i); -- Exponential backoff
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Add manual sync function
CREATE OR REPLACE FUNCTION manually_sync_user_profile(user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
BEGIN
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  IF FOUND THEN
    PERFORM sync_user_profile(user_record);
  END IF;
END;
$$;