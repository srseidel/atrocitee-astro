-- Setup Row Level Security (RLS) policies for charities table
-- This allows authenticated users to read charity data

-- Enable RLS on charities table
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active charities
CREATE POLICY "Allow authenticated users to read active charities"
ON charities
FOR SELECT
TO authenticated
USING (active = true);

-- Allow admins to read all charities (active and inactive)
CREATE POLICY "Allow admins to read all charities"
ON charities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to insert new charities
CREATE POLICY "Allow admins to insert charities"
ON charities
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to update charities
CREATE POLICY "Allow admins to update charities"
ON charities
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete charities
CREATE POLICY "Allow admins to delete charities"
ON charities
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);