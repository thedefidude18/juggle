/*
  # Fix RLS Policies for User Authentication

  1. Changes
    - Update RLS policies to handle Privy DIDs correctly
    - Add policies for user profile management
    - Fix user creation and update policies
  
  2. Security
    - Enable RLS on users table
    - Add proper policies for profile management
*/

-- Update users table RLS policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Allow users to view all profiles
CREATE POLICY "view_all_profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "update_own_profile"
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
  );

-- Allow new user creation
CREATE POLICY "insert_new_profile"
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

-- Function to sync user profile
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, username, avatar_url)
  VALUES (
    CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN privy_did_to_uuid(NEW.id)
      ELSE NEW.id::uuid
    END,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || substr(md5(random()::text), 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();