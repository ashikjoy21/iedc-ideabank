-- Drop the view if it exists
DROP VIEW IF EXISTS idea_details;

-- Create the view with the correct table structure and better category handling
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
          'name', LOWER(c.name)  -- Ensure consistent casing
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

-- Create an index to improve category filtering performance
CREATE INDEX IF NOT EXISTS idx_idea_categories_idea_id_category_id 
ON idea_categories(idea_id, category_id); 