/*
  # Add Event Payout System
  
  1. Changes
    - Add payout_status to events table
    - Add is_admin flag to users table
    - Add payout_approved_at and payout_approved_by to events table
  
  2. Security
    - Only admins can approve payouts
    - Users can view payout status
*/

-- Add admin flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add payout fields to events
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'approved', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS payout_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_approved_by uuid REFERENCES users(id);

-- Function for admins to approve payouts
CREATE OR REPLACE FUNCTION approve_event_payout(event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_user_id := auth.uid()::uuid;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM users WHERE id = v_user_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can approve payouts';
  END IF;

  -- Update event payout status
  UPDATE events
  SET 
    payout_status = 'approved',
    payout_approved_at = now(),
    payout_approved_by = v_user_id
  WHERE id = event_id
  AND payout_status = 'pending';

  RETURN FOUND;
END;
$$;