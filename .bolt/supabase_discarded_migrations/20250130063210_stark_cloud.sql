-- Create function to get profile by ID or username with explicit naming
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
SET search_path = public
AS $$
BEGIN
  -- First try to find by UUID
  BEGIN
    RETURN QUERY
    SELECT 
      users.id AS user_id,
      users.name AS user_name,
      users.username AS user_username,
      users.avatar_url AS user_avatar_url,
      users.bio AS user_bio,
      COALESCE(users.followers_count, 0) AS user_followers_count,
      COALESCE(users.following_count, 0) AS user_following_count,
      EXISTS (
        SELECT 1 FROM followers 
        WHERE followers.following_id = users.id 
        AND followers.follower_id = auth.uid()::uuid
      ) AS user_is_following,
      users.created_at AS user_created_at,
      users.updated_at AS user_updated_at
    FROM users
    WHERE users.id = search_identifier::uuid;

    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If UUID cast fails, continue to username search
  END;

  -- If no results or UUID cast failed, try username
  RETURN QUERY
  SELECT 
    users.id AS user_id,
    users.name AS user_name,
    users.username AS user_username,
    users.avatar_url AS user_avatar_url,
    users.bio AS user_bio,
    COALESCE(users.followers_count, 0) AS user_followers_count,
    COALESCE(users.following_count, 0) AS user_following_count,
    EXISTS (
      SELECT 1 FROM followers 
      WHERE followers.following_id = users.id 
      AND followers.follower_id = auth.uid()::uuid
    ) AS user_is_following,
    users.created_at AS user_created_at,
    users.updated_at AS user_updated_at
  FROM users
  WHERE users.username = search_identifier;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_by_identifier(text) TO anon;