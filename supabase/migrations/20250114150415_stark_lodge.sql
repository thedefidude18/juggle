-- Temporarily disable RLS to allow policy changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_access_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a completely permissive policy for authenticated users
CREATE POLICY "authenticated_access_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;

-- Update the handle_new_user function to be more resilient
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