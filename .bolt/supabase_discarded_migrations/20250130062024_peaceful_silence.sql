-- Create function to get profile by ID or username
CREATE OR REPLACE FUNCTION get_profile_by_identifier(identifier text)
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  avatar_url text,
  bio text,
  followers_count integer,
  following_count integer,
  is_following boolean,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First try to find by UUID
  BEGIN
    RETURN QUERY
    SELECT 
      u.id,
      u.name,
      u.username,
      u.avatar_url,
      u.bio,
      COALESCE(u.followers_count, 0),
      COALESCE(u.following_count, 0),
      EXISTS (
        SELECT 1 FROM followers f 
        WHERE f.following_id = u.id 
        AND f.follower_id = auth.uid()::uuid
      ) as is_following,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE u.id = identifier::uuid;

    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If UUID cast fails, continue to username search
  END;

  -- If no results or UUID cast failed, try username
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.username,
    u.avatar_url,
    u.bio,
    COALESCE(u.followers_count, 0),
    COALESCE(u.following_count, 0),
    EXISTS (
      SELECT 1 FROM followers f 
      WHERE f.following_id = u.id 
      AND f.follower_id = auth.uid()::uuid
    ) as is_following,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.username = identifier;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(text) TO anon;