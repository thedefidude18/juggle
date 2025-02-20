-- Drop existing foreign key if exists
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_creator_id_fkey;

-- Add correct foreign key relationship
ALTER TABLE events
ADD CONSTRAINT events_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES users(id)
ON DELETE SET NULL;

-- Enable RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Events are viewable by everyone"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';