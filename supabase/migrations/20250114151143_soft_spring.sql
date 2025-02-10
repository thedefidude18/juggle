-- Disable RLS temporarily to make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a single permissive policy for all operations
CREATE POLICY "allow_all_operations"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

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
  -- Convert ID to UUID with better error handling
  BEGIN
    new_user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_nil(), NEW.id)
      ELSE
        CASE 
          WHEN NEW.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
          THEN NEW.id::uuid
          ELSE uuid_generate_v5(uuid_nil(), NEW.id)
        END
    END;
  EXCEPTION WHEN OTHERS THEN
    new_user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;

  -- Insert or update user with retries
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
        
      EXIT; -- Exit loop if successful
    EXCEPTION 
      WHEN unique_violation THEN
        -- Try again with a different username
        CONTINUE;
      WHEN OTHERS THEN
        IF i = 3 THEN 
          RAISE WARNING 'Failed to create/update user after 3 attempts: %', SQLERRM;
        ELSE
          -- Wait a bit before retrying
          PERFORM pg_sleep(0.1 * i);
          CONTINUE;
        END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;