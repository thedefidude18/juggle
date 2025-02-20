-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Insert new user with retry logic
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
      );
      
      -- Create wallet for new user
      INSERT INTO wallets (user_id, balance)
      VALUES (new_user_id, 10000)
      ON CONFLICT (user_id) DO NOTHING;
      
      EXIT; -- Exit loop if successful
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
          avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
          updated_at = now()
        WHERE id = new_user_id;
        EXIT;
      WHEN OTHERS THEN
        IF i = 3 THEN
          RAISE WARNING 'Error in handle_new_user after 3 attempts: %', SQLERRM;
          RETURN NULL;
        END IF;
        PERFORM pg_sleep(0.1 * i);
        CONTINUE;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all existing users have wallets
INSERT INTO wallets (user_id, balance)
SELECT id, 10000 FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM wallets w 
  WHERE w.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;