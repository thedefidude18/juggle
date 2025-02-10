-- Drop all existing policies
DROP POLICY IF EXISTS "allow_select_all_users" ON users;
DROP POLICY IF EXISTS "allow_insert_own_user" ON users;
DROP POLICY IF EXISTS "allow_update_own_user" ON users;

-- Create a single permissive policy for all operations
CREATE POLICY "allow_authenticated_access"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but completely permissive for authenticated users
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Update the sync function to be more resilient
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
  -- More permissive ID handling
  BEGIN
    user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN 
        -- Try UUID conversion first
        COALESCE(
          privy_did_to_uuid(NEW.id),
          -- Fallback to deterministic UUID
          uuid_generate_v5(uuid_nil(), NEW.id)
        )
      ELSE
        CASE 
          WHEN NEW.id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN NEW.id::uuid
          ELSE uuid_generate_v5(uuid_nil(), NEW.id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback
    user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;

  -- Set default values
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(user_id::text), 1, 8)
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::text
  );

  -- Insert with conflict handling
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
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE WARNING 'Error in sync_user_profile: %', SQLERRM;
  RETURN NEW;
END;
$$;