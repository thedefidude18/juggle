-- Create the users_view if it doesn't exist
CREATE OR REPLACE VIEW users_view AS
SELECT 
    id,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    raw_user_meta_data->>'status' as status
FROM auth.users;

-- Enable RLS
ALTER VIEW users_view ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read users_view" ON users_view;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON auth.users;

-- Create policy to allow authenticated users to read user data
CREATE POLICY "Allow authenticated users to read users_view"
ON users_view
FOR SELECT
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT SELECT ON users_view TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
