-- Disable RLS temporarily
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_wallet_access" ON wallets;
DROP POLICY IF EXISTS "authenticated_access_policy" ON users;

-- Create completely permissive policies
CREATE POLICY "allow_all_wallet_operations"
  ON wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_user_operations"
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Update the handle_new_user function to handle duplicate usernames better
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Set base username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(NEW.id), 1, 8)
  );

  -- Try to find a unique username
  LOOP
    IF counter = 0 THEN
      final_username := base_username;
    ELSE
      final_username := base_username || '_' || counter;
    END IF;

    BEGIN
      INSERT INTO users (
        id,
        name,
        username,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        final_username,
        COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
        ),
        now(),
        now()
      );
      EXIT; -- Exit loop if insert succeeds
    EXCEPTION 
      WHEN unique_violation THEN
        counter := counter + 1;
        IF counter > 10 THEN
          -- After 10 attempts, use timestamp to ensure uniqueness
          final_username := base_username || '_' || floor(extract(epoch from now()));
          
          INSERT INTO users (
            id,
            name,
            username,
            avatar_url,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            final_username,
            COALESCE(
              NEW.raw_user_meta_data->>'avatar_url',
              'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
            ),
            now(),
            now()
          );
          EXIT;
        END IF;
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING 'Error creating user: %', SQLERRM;
        RETURN NEW;
    END;
  END LOOP;

  -- Create wallet for new user
  BEGIN
    INSERT INTO wallets (user_id, balance)
    VALUES (NEW.id, 10000)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating wallet: %', SQLERRM;
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