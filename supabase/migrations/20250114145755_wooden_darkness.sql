-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a single permissive policy for authenticated users
CREATE POLICY "authenticated_access_policy"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON users TO authenticated;

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
  new_user_id := CASE 
    WHEN NEW.id LIKE 'did:privy:%' THEN 
      COALESCE(
        privy_did_to_uuid(NEW.id),
        uuid_generate_v5(uuid_nil(), NEW.id)
      )
    ELSE
      NEW.id::uuid
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
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Update existing user
      UPDATE public.users 
      SET
        name = COALESCE(NEW.raw_user_meta_data->>'name', name),
        username = CASE 
          WHEN username IS NULL OR username = '' 
          THEN COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || substr(md5(new_user_id::text), 1, 8))
          ELSE username 
        END,
        avatar_url = CASE 
          WHEN avatar_url IS NULL OR avatar_url = '' 
          THEN COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new_user_id::text)
          ELSE avatar_url 
        END,
        updated_at = now()
      WHERE id = new_user_id;
    WHEN OTHERS THEN
      -- Log error but don't fail
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;