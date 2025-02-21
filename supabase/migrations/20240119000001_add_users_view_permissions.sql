-- Create policy to allow authenticated users to read users_view
CREATE POLICY "Allow authenticated users to read users_view"
ON public.users_view
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on users_view if not already enabled
ALTER TABLE public.users_view ENABLE ROW LEVEL SECURITY;

-- Grant usage permissions
GRANT SELECT ON public.users_view TO authenticated;