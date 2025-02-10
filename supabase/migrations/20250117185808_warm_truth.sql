-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all followers" ON followers;
DROP POLICY IF EXISTS "Users can manage their own follows" ON followers;

-- Create more permissive policies
CREATE POLICY "anyone_can_view_followers"
  ON followers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_follow"
  ON followers
  FOR INSERT
  TO authenticated
  WITH CHECK (follower_id::text = auth.uid()::text);

CREATE POLICY "users_can_unfollow"
  ON followers
  FOR DELETE
  TO authenticated
  USING (follower_id::text = auth.uid()::text);

-- Ensure RLS is enabled
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON followers TO authenticated;
GRANT SELECT ON followers TO anon;

-- Create function to handle follows
CREATE OR REPLACE FUNCTION follow_user(target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_follower_id uuid;
BEGIN
  -- Get current user's ID
  v_follower_id := auth.uid()::uuid;
  
  -- Prevent self-follow
  IF v_follower_id = target_id THEN
    RETURN false;
  END IF;

  -- Insert follow relationship
  INSERT INTO followers (follower_id, following_id)
  VALUES (v_follower_id, target_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata
  ) VALUES (
    target_id,
    'follow',
    'New Follower',
    (SELECT name FROM users WHERE id = v_follower_id) || ' started following you',
    jsonb_build_object(
      'follower_id', v_follower_id
    )
  );

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Create function to handle unfollows
CREATE OR REPLACE FUNCTION unfollow_user(target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM followers
  WHERE follower_id = auth.uid()::uuid
  AND following_id = target_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;