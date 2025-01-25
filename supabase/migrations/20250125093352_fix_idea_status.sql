-- Drop existing constraint if any
ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_status_check;

-- Create the enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE idea_status AS ENUM ('pending', 'approved', 'rejected', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing rows to valid status
UPDATE ideas 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'approved', 'rejected', 'in_progress', 'completed');

-- Alter the column to use the enum type
ALTER TABLE ideas 
  ALTER COLUMN status TYPE idea_status USING status::idea_status;

-- Set the default
ALTER TABLE ideas 
  ALTER COLUMN status SET DEFAULT 'pending'::idea_status; 