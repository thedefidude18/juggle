-- Drop existing policies
DROP POLICY IF EXISTS "users_read_access" ON users;
DROP POLICY IF EXISTS "users_insert_access" ON users;
DROP POLICY IF EXISTS "users_update_access" ON users;

-- Create a single permissive policy for authenticated users
CREATE POLICY "authenticated_users_access"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Update the privy_did_to_uuid function to be more resilient
CREATE OR REPLACE FUNCTION privy_did_to_uuid(did text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result uuid;
BEGIN
  -- First try direct UUID cast if it looks like a UUID
  BEGIN
    IF did ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      result := did::uuid;
      RETURN result;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to next method if cast fails
  END;

  -- For Privy DIDs, create a deterministic UUID
  IF did LIKE 'did:privy:%' THEN
    -- Extract the unique part after 'did:privy:'
    result := uuid_generate_v5(
      uuid_nil(),
      substring(did from 11) -- Skip 'did:privy:'
    );
    RETURN result;
  END IF;

  -- Fallback: generate a deterministic UUID from the entire string
  RETURN uuid_generate_v5(uuid_nil(), did);
END;
$$;

-- Update the sync_user_profile function to handle errors gracefully
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
  -- Get UUID from ID
  user_id := privy_did_to_uuid(NEW.id);
  
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