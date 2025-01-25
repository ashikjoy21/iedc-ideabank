-- Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update the status type for ideas if needed
DO $$ 
BEGIN
    ALTER TABLE ideas 
        ALTER COLUMN status TYPE TEXT,
        ALTER COLUMN status SET DEFAULT 'pending';
    
    -- Update any existing statuses to match the new system
    UPDATE ideas 
    SET status = 'pending' 
    WHERE status NOT IN ('pending', 'approved', 'rejected', 'in_progress', 'completed');
    
EXCEPTION
    WHEN others THEN null;
END $$;

-- Add admin-specific policies
DO $$ 
BEGIN
    -- Policy for admins to update any idea
    DROP POLICY IF EXISTS "Admins can update any idea" ON ideas;
    CREATE POLICY "Admins can update any idea" ON ideas
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND is_admin = true
            )
        );

    -- Policy for admins to view all ideas
    DROP POLICY IF EXISTS "Admins can view all ideas" ON ideas;
    CREATE POLICY "Admins can view all ideas" ON ideas
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND is_admin = true
            )
        );

    -- Update existing ideas policy to only show approved ideas to non-admins
    DROP POLICY IF EXISTS "Ideas are viewable by everyone" ON ideas;
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
END $$;

-- Make a user admin (replace with actual admin user id)
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-id'; 