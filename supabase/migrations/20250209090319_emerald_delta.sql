-- Function to get user profile by identifier (id or username)
CREATE OR REPLACE FUNCTION get_profile_by_identifier(search_identifier text)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_username text,
  user_avatar_url text,
  user_bio text,
  user_followers_count integer,
  user_following_count integer,
  user_is_following boolean,
  user_created_at timestamptz,
  user_updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id uuid;
BEGIN
  -- Get current user's ID
  BEGIN
    v_current_user_id := CASE 
      WHEN auth.uid()::text LIKE 'did:privy:%' THEN 
        uuid_generate_v5(uuid_generate_v4(), auth.uid()::text)
      ELSE
        auth.uid()::uuid
    END;
  EXCEPTION WHEN OTHERS THEN
    v_current_user_id := uuid_generate_v5(uuid_generate_v4(), auth.uid()::text);
  END;

  RETURN QUERY
  WITH target_user AS (
    SELECT *
    FROM users
    WHERE 
      -- Try UUID first
      CASE 
        WHEN search_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          id = search_identifier::uuid
        ELSE
          -- Then try username
          username = search_identifier
      END
  )
  SELECT
    u.id as user_id,
    u.name as user_name,
    u.username as user_username,
    u.avatar_url as user_avatar_url,
    u.bio as user_bio,
    COALESCE(u.followers_count, 0) as user_followers_count,
    COALESCE(u.following_count, 0) as user_following_count,
    EXISTS (
      SELECT 1 FROM followers f 
      WHERE f.follower_id = v_current_user_id 
      AND f.following_id = u.id
    ) as user_is_following,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at
  FROM target_user u;
END;
$$;