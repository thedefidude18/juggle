-- Add edited_at column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Update existing rows to have edited_at same as created_at
UPDATE public.messages
SET edited_at = created_at
WHERE edited_at IS NULL;