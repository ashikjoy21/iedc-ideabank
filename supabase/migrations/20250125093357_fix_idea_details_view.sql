-- Drop the view if it exists
DROP VIEW IF EXISTS idea_details;

-- Create the view with the correct table structure
CREATE OR REPLACE VIEW idea_details AS
SELECT 
  i.*,
  p.username,
  p.avatar_url,
  COALESCE(s.comment_count, 0) as comment_count,
  COALESCE(s.vote_count, 0) as vote_count,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', c.name
        )
      )
      FROM idea_categories ic
      JOIN categories c ON ic.category_id = c.id
      WHERE ic.idea_id = i.id
    ),
    '[]'::jsonb
  ) as categories
FROM ideas i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN idea_stats s ON i.id = s.idea_id;

-- Grant necessary permissions
GRANT SELECT ON idea_details TO authenticated;
GRANT SELECT ON idea_details TO anon;

-- Update RLS policies on ideas table
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

-- Make sure RLS is enabled on ideas table
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY; 