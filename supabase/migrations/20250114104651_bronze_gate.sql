/*
  # Fix User Authentication and Profile Management

  1. Changes
    - Add missing bio column to users table
    - Update RLS policies for better security
    - Fix user profile sync function
    - Add proper indexes
  
  2. Security
    - Ensure proper RLS for all operations
    - Handle Privy DIDs correctly
*/

-- Add bio column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio text;

-- Drop existing policies
DROP POLICY IF EXISTS "view_all_profiles" ON users;
DROP POLICY IF EXISTS "update_own_profile" ON users;
DROP POLICY IF EXISTS "insert_new_profile" ON users;

-- Create more specific policies
CREATE POLICY "anyone_can_view_profiles"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "users_can_update_own_profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        id = auth.uid()::uuid
    END
  )
  WITH CHECK (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        id = auth.uid()::uuid
    END
  );

CREATE POLICY "users_can_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        id = privy_did_to_uuid(auth.uid()::text)
      ELSE 
        id = auth.uid()::uuid
    END
  );

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
  user_id := CASE 
    WHEN NEW.id LIKE 'did:privy:%' THEN privy_did_to_uuid(NEW.id)
    ELSE NEW.id::uuid
  END;
  
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(random()::text), 1, 8)
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::text
  );

  -- Insert or update user profile
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();