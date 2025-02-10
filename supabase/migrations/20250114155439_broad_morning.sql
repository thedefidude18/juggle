-- Add reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id),
  reported_id uuid REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('user', 'group', 'event')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id),
  CONSTRAINT different_users CHECK (reporter_id != reported_id)
);

-- Add blocked status to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Add blocked status to groups
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Function to block a user
CREATE OR REPLACE FUNCTION block_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_admin_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can block users';
  END IF;

  -- Block user
  UPDATE users
  SET 
    is_blocked = true,
    updated_at = now()
  WHERE id = user_id;

  -- Insert into audit log
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'block_user',
    'user',
    user_id,
    jsonb_build_object('action', 'block')
  );

  RETURN true;
END;
$$;

-- Function to unblock a user
CREATE OR REPLACE FUNCTION unblock_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_admin_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can unblock users';
  END IF;

  -- Unblock user
  UPDATE users
  SET 
    is_blocked = false,
    updated_at = now()
  WHERE id = user_id;

  -- Insert into audit log
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'unblock_user',
    'user',
    user_id,
    jsonb_build_object('action', 'unblock')
  );

  RETURN true;
END;
$$;

-- Function to delete a group
CREATE OR REPLACE FUNCTION delete_group(group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_admin_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can delete groups';
  END IF;

  -- Delete group
  DELETE FROM chats
  WHERE id = group_id AND is_group = true;

  -- Insert into audit log
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'delete_group',
    'group',
    group_id,
    jsonb_build_object('action', 'delete')
  );

  RETURN true;
END;
$$;

-- Function to resolve a report
CREATE OR REPLACE FUNCTION resolve_report(report_id uuid, resolution text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_admin_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can resolve reports';
  END IF;

  -- Update report status
  UPDATE reports
  SET 
    status = 'resolved',
    resolved_at = now(),
    resolved_by = v_admin_id
  WHERE id = report_id;

  -- Insert into audit log
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'resolve_report',
    'report',
    report_id,
    jsonb_build_object(
      'action', 'resolve',
      'resolution', resolution
    )
  );

  RETURN true;
END;
$$;

-- Create admin actions audit log
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  ));

CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  ));

CREATE POLICY "Admins can view audit log"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  ));

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_id ON admin_actions(target_id);