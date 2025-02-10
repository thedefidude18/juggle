-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
  file_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view messages in their tickets"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Users can send messages to their tickets"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND user_id = auth.uid()::uuid
    )
  );

-- Create function to create support ticket
CREATE OR REPLACE FUNCTION create_support_ticket(
  p_user_id uuid,
  p_initial_message text,
  p_priority text DEFAULT 'normal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id uuid;
BEGIN
  -- Create ticket
  INSERT INTO support_tickets (
    user_id,
    priority
  ) VALUES (
    p_user_id,
    p_priority
  ) RETURNING id INTO v_ticket_id;

  -- Add initial message
  INSERT INTO support_messages (
    ticket_id,
    sender_id,
    content
  ) VALUES (
    v_ticket_id,
    p_user_id,
    p_initial_message
  );

  -- Add automated response
  INSERT INTO support_messages (
    ticket_id,
    content,
    type
  ) VALUES (
    v_ticket_id,
    'Thanks for reaching out! Our support team will get back to you shortly.',
    'text'
  );

  RETURN v_ticket_id;
END;
$$;