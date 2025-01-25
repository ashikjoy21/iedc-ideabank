-- Drop existing view
DROP VIEW IF EXISTS idea_details;

-- Recreate view with consistent category name casing
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
          'name', LOWER(c.name)  -- Convert category names to lowercase
        )
      )
      FROM idea_categories ic
      JOIN categories c ON ic.category_id = c.id
      WHERE ic.idea_id = i.id
      GROUP BY ic.idea_id  -- Ensure proper grouping
    ),
    '[]'::jsonb
  ) as categories
FROM ideas i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN idea_stats s ON i.id = s.idea_id;

-- Update existing category names to be lowercase
UPDATE categories
SET name = LOWER(name)
WHERE name != LOWER(name);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idea_categories_category_id 
ON idea_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_categories_name_lower 
ON categories(LOWER(name));

-- Create a function to help with category filtering
CREATE OR REPLACE FUNCTION contains_category(categories jsonb, category_name text)
RETURNS boolean AS $$
BEGIN
  RETURN categories @> jsonb_build_array(jsonb_build_object('name', LOWER(category_name)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION contains_category TO authenticated;
GRANT EXECUTE ON FUNCTION contains_category TO anon; 