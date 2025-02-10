/*
  # Fix Events and Auth Issues
  
  1. Changes
    - Fix events table foreign key relationship
    - Add UUID conversion function for Privy auth
*/

-- Drop existing events table if it exists
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS event_pools CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Create events table with correct foreign key
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  wager_amount integer NOT NULL,
  max_participants integer,
  banner_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_time > start_time)
);

-- Recreate dependent tables
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  prediction boolean NOT NULL,
  joined_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  total_amount integer NOT NULL DEFAULT 0,
  admin_fee integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_pools ENABLE ROW LEVEL SECURITY;

-- Create function to convert Privy DID to UUID
CREATE OR REPLACE FUNCTION privy_did_to_uuid(did text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  -- Use a deterministic way to generate UUID from DID
  did_hash bytea;
BEGIN
  did_hash := decode(substr(md5(did), 1, 32), 'hex');
  RETURN encode(did_hash, 'hex')::uuid;
END;
$$;

-- Update auth trigger to handle Privy DIDs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, username, avatar_url)
  VALUES (
    CASE 
      WHEN new.id LIKE 'did:privy:%' THEN privy_did_to_uuid(new.id)
      ELSE new.id::uuid
    END,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_pools_event_id ON event_pools(event_id);

-- Recreate policies
CREATE POLICY "view_all_events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "create_events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = creator_id::text);
CREATE POLICY "view_event_participants" ON event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "join_events" ON event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "view_event_pools" ON event_pools FOR SELECT TO authenticated USING (true);