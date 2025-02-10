-- Drop existing policies
DROP POLICY IF EXISTS "allow_read_all" ON users;
DROP POLICY IF EXISTS "allow_insert_authenticated" ON users;
DROP POLICY IF EXISTS "allow_update_own" ON users;

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies
CREATE POLICY "users_read_policy" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "users_insert_policy" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "users_update_policy" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "users_delete_policy" 
  ON users 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Update handle_new_user function to be more permissive
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Convert ID to UUID
  BEGIN
    new_user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_nil(), NEW.id)
      ELSE
        NEW.id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    new_user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;

  -- Insert or update user
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
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;