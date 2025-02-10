/*
  # Create event betting system tables

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `wager_amount` (integer)
      - `max_participants` (integer)
      - `banner_url` (text)
      - `status` (text) -- 'pending', 'active', 'completed', 'cancelled'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references auth.users)
      - `prediction` (boolean) -- true for YES, false for NO
      - `joined_at` (timestamptz)
      - `status` (text) -- 'pending', 'paired', 'completed'

    - `event_pools`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `total_amount` (integer)
      - `admin_fee` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id),
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

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction boolean NOT NULL,
  joined_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(event_id, user_id)
);

-- Create event_pools table
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

-- Policies for events
CREATE POLICY "Users can view all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Policies for event_participants
CREATE POLICY "Users can view event participants"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for event_pools
CREATE POLICY "Users can view event pools"
  ON event_pools
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update event pool
CREATE OR REPLACE FUNCTION update_event_pool()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate admin fee (3%)
  NEW.admin_fee := (NEW.total_amount * 3) / 100;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update event pool
CREATE TRIGGER update_event_pool_trigger
  BEFORE INSERT OR UPDATE ON event_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_event_pool();