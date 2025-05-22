-- Grant necessary permissions for printful_sync_history table
GRANT ALL ON printful_sync_history TO authenticated;
GRANT ALL ON printful_sync_history TO service_role;

-- Ensure RLS policies are in place
ALTER TABLE printful_sync_history ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage sync history"
ON printful_sync_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for service role
CREATE POLICY "Allow service role to manage sync history"
ON printful_sync_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 