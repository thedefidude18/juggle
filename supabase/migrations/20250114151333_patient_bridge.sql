-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_all_operations" ON users;
DROP POLICY IF EXISTS "authenticated_access_policy" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a completely permissive policy for public access
CREATE POLICY "public_access_policy"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant full access to both authenticated and anonymous users
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Update the handle_new_user function with improved error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
  username_base text;
  username_attempt text;
  attempt_count integer := 0;
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

  -- Set base username
  username_base := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(new_user_id::text), 1, 8)
  );

  -- Try to insert with retries for unique username
  LOOP
    BEGIN
      username_attempt := CASE 
        WHEN attempt_count = 0 THEN username_base
        ELSE username_base || '_' || attempt_count::text
      END;

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
        username_attempt,
        COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new_user_id::text
        ),
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        username = CASE 
          WHEN users.username IS NULL OR users.username = '' 
          THEN username_attempt
          ELSE users.username 
        END,
        avatar_url = CASE 
          WHEN users.avatar_url IS NULL OR users.avatar_url = '' 
          THEN EXCLUDED.avatar_url 
          ELSE users.avatar_url 
        END,
        updated_at = now();

      EXIT; -- Successful insert/update
    EXCEPTION 
      WHEN unique_violation THEN
        -- Only retry for username conflicts
        IF attempt_count >= 10 THEN
          -- After 10 attempts, use a random suffix
          username_attempt := username_base || '_' || substr(md5(random()::text), 1, 8);
          
          -- Final attempt with random suffix
          INSERT INTO public.users (
            id, name, username, avatar_url, created_at, updated_at
          ) VALUES (
            new_user_id,
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            username_attempt,
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new_user_id::text),
            now(),
            now()
          )
          ON CONFLICT (id) DO UPDATE
          SET
            name = EXCLUDED.name,
            username = CASE 
              WHEN users.username IS NULL OR users.username = '' 
              THEN username_attempt
              ELSE users.username 
            END,
            avatar_url = CASE 
              WHEN users.avatar_url IS NULL OR users.avatar_url = '' 
              THEN EXCLUDED.avatar_url 
              ELSE users.avatar_url 
            END,
            updated_at = now();
            
          EXIT;
        END IF;
        
        attempt_count := attempt_count + 1;
        CONTINUE;
      WHEN OTHERS THEN
        -- Log other errors but don't fail
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        EXIT;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;