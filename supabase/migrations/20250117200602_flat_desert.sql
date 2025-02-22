-- Add metadata column to notifications if it doesn't exist
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index on metadata for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING gin (metadata);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;

-- Create new policies with unique names
CREATE POLICY "notifications_view_policy_v2"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "notifications_update_policy_v2"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;
