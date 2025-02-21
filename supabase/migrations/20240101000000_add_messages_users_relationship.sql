-- Add foreign key for sender_id in messages table
ALTER TABLE public.messages
ADD CONSTRAINT fk_sender
FOREIGN KEY (sender_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create a view to safely expose user data
CREATE OR REPLACE VIEW public.users_view AS
SELECT 
    id,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    raw_user_meta_data->>'status' as status
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.users_view TO authenticated;