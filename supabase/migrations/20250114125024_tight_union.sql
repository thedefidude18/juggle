-- Drop existing policies
DROP POLICY IF EXISTS "allow_all_authenticated_operations" ON users;

-- Create more permissive policies for Privy auth
CREATE POLICY "allow_select_all_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_own_user"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_own_user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Improved user profile sync function with better error handling
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS trigger AS $$
DECLARE
  user_id uuid;
  user_name text;
  user_username text;
  user_avatar text;
BEGIN
  -- Convert ID and set default values
  BEGIN
    user_id := CASE 
      WHEN NEW.id LIKE 'did:privy:%' THEN privy_did_to_uuid(NEW.id)
      ELSE NEW.id::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to a deterministic UUID if conversion fails
    user_id := uuid_generate_v5(uuid_nil(), NEW.id);
  END;
  
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    'user_' || substr(md5(user_id::text), 1, 8)
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || user_id::text
  );

  -- Insert or update user profile with retries
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
        updated_at = now()
      WHERE 
        users.id = EXCLUDED.id;
        
      EXIT; -- Exit loop if successful
    EXCEPTION WHEN OTHERS THEN
      IF i = 3 THEN RAISE; END IF; -- Re-raise error on last attempt
      PERFORM pg_sleep(0.1 * i); -- Exponential backoff
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For new events
  IF (TG_OP = 'INSERT') THEN
    -- Your insert-specific logic here
    RETURN NEW;
  
  -- For updated events
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Your update-specific logic here
    RETURN NEW;
  
  -- For deleted events
  ELSIF (TG_OP = 'DELETE') THEN
    -- Your delete-specific logic here
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_event_changes ON events;

-- Create new trigger
CREATE TRIGGER on_event_changes
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_changes();
