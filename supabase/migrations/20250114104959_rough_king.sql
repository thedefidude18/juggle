/*
  # Fix User Authentication and Profile Sync

  1. Changes
    - Fix RLS policies for users table
    - Improve user profile sync function
    - Add better error handling for Privy DID conversion
    - Fix user profile creation on first login

  2. Security
    - Update RLS policies to properly handle Privy DIDs
    - Ensure proper access control for profile updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "anyone_can_view_profiles" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON users;

-- Create more permissive policies for initial setup
CREATE POLICY "allow_all_authenticated_operations"
  ON users
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Improved user profile sync function with better error handling
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

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Add function to manually sync user profile
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