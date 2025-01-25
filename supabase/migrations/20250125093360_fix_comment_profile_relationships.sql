-- Drop existing constraints if any
ALTER TABLE comments 
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Add proper foreign key relationships
ALTER TABLE comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Update the comments query in idea_details view
DROP VIEW IF EXISTS comment_details;
CREATE VIEW comment_details AS
SELECT 
  c.*,
  p.username,
  p.avatar_url
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON comment_details TO authenticated;
GRANT SELECT ON comment_details TO anon; 