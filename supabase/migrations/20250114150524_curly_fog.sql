-- Recreate users table with proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  name text,
  username text UNIQUE,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_access_policy" ON users;

-- Create new policies
CREATE POLICY "allow_read_all"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "allow_insert_authenticated"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Convert Privy DID to UUID if needed
  BEGIN
    new_user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN 
        COALESCE(
          privy_did_to_uuid(NEW.id),
          uuid_generate_v5(uuid_nil(), NEW.id)
        )
      ELSE
        NEW.id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to using a deterministic UUID
    new_user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;

  -- Insert with more permissive error handling
  BEGIN
    INSERT INTO public.users (
      id,
      name,
      username,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || substr(md5(new_user_id::text), 1, 8)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new_user_id::text),
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
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();