-- First, drop all policies that depend on the status column
DROP POLICY IF EXISTS "Ideas are viewable by everyone" ON ideas;
DROP POLICY IF EXISTS "Authenticated users can create ideas" ON ideas;
DROP POLICY IF EXISTS "Users can update own ideas" ON ideas;
DROP POLICY IF EXISTS "Admins can update any idea" ON ideas;
DROP POLICY IF EXISTS "Admins can view all ideas" ON ideas;

-- Now we can safely alter the column
ALTER TABLE ideas 
    ALTER COLUMN status TYPE TEXT,
    ALTER COLUMN status SET DEFAULT 'pending';

-- Add constraint to ensure valid status values
DO $$ 
BEGIN
    ALTER TABLE ideas
        DROP CONSTRAINT IF EXISTS ideas_status_check;
    
    ALTER TABLE ideas
        ADD CONSTRAINT ideas_status_check
        CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed'));
EXCEPTION
    WHEN others THEN null;
END $$;

-- Recreate all policies
CREATE POLICY "Ideas are viewable by everyone" ON ideas
    FOR SELECT USING (
        status = 'approved' OR 
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND is_admin = true
        )
    );

CREATE POLICY "Authenticated users can create ideas" ON ideas
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = user_id AND
        status = 'pending'  -- Ensure new ideas start as pending
    );

CREATE POLICY "Users can update own ideas" ON ideas
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status NOT IN ('approved', 'rejected')  -- Users can't update approved/rejected ideas
    );

CREATE POLICY "Admins can update any idea" ON ideas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can view all ideas" ON ideas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND is_admin = true
        )
    ); 