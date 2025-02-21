-- First, ensure we drop any existing constraints
ALTER TABLE IF EXISTS public.messages 
DROP CONSTRAINT IF EXISTS fk_sender_id;

-- Create message_reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_message
        FOREIGN KEY(message_id) 
        REFERENCES public.messages(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id 
ON public.message_reactions(message_id);

-- Update the messages query in EventChat
ALTER TABLE public.messages
ADD CONSTRAINT fk_sender
    FOREIGN KEY (sender_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Recreate the users view
DROP VIEW IF EXISTS public.users_view CASCADE;
CREATE VIEW public.users_view AS 
SELECT 
    id,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    raw_user_meta_data->>'status' as status,
    last_sign_in_at,
    created_at,
    updated_at
FROM auth.users;

-- Make the view updatable
ALTER VIEW public.users_view SET (security_invoker = true);
