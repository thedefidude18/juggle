-- Temporarily disable RLS to allow initial setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_authenticated_access" ON users;
DROP POLICY IF EXISTS "allow_select_all_users" ON users;
DROP POLICY IF EXISTS "allow_insert_own_user" ON users;
DROP POLICY IF EXISTS "allow_update_own_user" ON users;

-- Create new unrestricted policies
CREATE POLICY "unrestricted_select"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "unrestricted_insert"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "unrestricted_update"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "unrestricted_delete"
  ON users
  FOR DELETE
  USING (true);

-- Re-enable RLS with unrestricted policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Update sync function to be completely unrestricted
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  user_name text;
  user_username text;
  user_avatar text;
BEGIN
  -- Simple ID conversion without restrictions
  user_id := CASE 
    WHEN NEW.id LIKE 'did:privy:%' THEN uuid_generate_v5(uuid_nil(), NEW.id)
    ELSE NEW.id::uuid
  END;

  -- Set default values
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(random()::text), 1, 8)
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::text
  );

  -- Unrestricted insert/update
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
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in sync_user_profile: %', SQLERRM;
  RETURN NEW;
END;
$$;