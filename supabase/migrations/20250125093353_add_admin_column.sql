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

-- Create an initial admin user (replace 'your-user-id' with actual admin user id)
-- UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';

-- Add policy for admin actions
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Add policy for viewing admin status
CREATE POLICY "Admin status is viewable by everyone" ON profiles
  FOR SELECT USING (true); 