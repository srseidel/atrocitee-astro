-- Add default_charity_id field to profiles table
-- This allows users to select a default charity for their donations

-- Add the column if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'default_charity_id'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN default_charity_id UUID REFERENCES charities(id) ON DELETE SET NULL;
        
        -- Add an index for performance
        CREATE INDEX idx_profiles_default_charity_id ON profiles(default_charity_id);
        
        -- Add a comment explaining the field
        COMMENT ON COLUMN profiles.default_charity_id IS 'Default charity for user donations - can be overridden per order';
    END IF;
END $$;