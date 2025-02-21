-- Grant permissions for users_view
CREATE OR REPLACE VIEW public.users_view AS
SELECT id, name, avatar_url, status
FROM public.users;

-- Enable RLS
ALTER VIEW public.users_view SET REFTABLE public.users;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to read users_view"
ON public.users_view
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT ON public.users_view TO authenticated;
GRANT SELECT ON public.users TO authenticated;