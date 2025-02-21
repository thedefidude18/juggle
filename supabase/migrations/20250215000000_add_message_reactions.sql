-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all reactions"
    ON message_reactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can add reactions"
    ON message_reactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
    ON message_reactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add edited_at column to messages
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS edited_at timestamptz,
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;