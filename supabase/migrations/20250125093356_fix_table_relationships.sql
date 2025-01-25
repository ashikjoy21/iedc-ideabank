-- Drop existing foreign key if any
ALTER TABLE ideas 
  DROP CONSTRAINT IF EXISTS ideas_user_id_fkey;

-- Add proper foreign key relationship between ideas and profiles
ALTER TABLE ideas 
  ADD CONSTRAINT ideas_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Drop existing view if it exists
DROP VIEW IF EXISTS idea_details;

-- Create a view to join ideas with user profiles and idea_stats
CREATE OR REPLACE VIEW idea_details AS
SELECT 
  i.*,
  p.username,
  p.avatar_url,
  COALESCE(s.vote_count, 0) as vote_count,
  COALESCE(s.comment_count, 0) as comment_count,
  COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object('name', c.name))
      FROM idea_categories ic
      JOIN categories c ON ic.category_id = c.id
      WHERE ic.idea_id = i.id
    ),
    '[]'::jsonb
  ) as categories
FROM ideas i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN idea_stats s ON i.id = s.idea_id;

-- Update the RLS policies on the ideas table
DROP POLICY IF EXISTS "Anyone can view ideas" ON ideas;
CREATE POLICY "Anyone can view ideas" ON ideas
  FOR SELECT USING (
    status = 'approved' OR 
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND is_admin = true
    )
  );

-- Make sure RLS is enabled on the ideas table
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON idea_details TO authenticated;
GRANT SELECT ON idea_details TO anon; 