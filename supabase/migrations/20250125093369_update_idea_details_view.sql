-- Update the idea_details view to include more profile information
CREATE OR REPLACE VIEW idea_details AS
SELECT 
  i.*,
  p.username,
  p.full_name,
  p.created_at as user_created_at,
  COALESCE(s.comment_count, 0) as comment_count,
  COALESCE(s.vote_count, 0) as vote_count,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', LOWER(c.name),
          'icon_name', c.icon_name
        )
      )
      FROM idea_categories ic
      JOIN categories c ON ic.category_id = c.id
      WHERE ic.idea_id = i.id
      GROUP BY ic.idea_id
    ),
    '[]'::jsonb
  ) as categories
FROM ideas i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN idea_stats s ON i.id = s.idea_id;

-- Update the comment_details view to include more profile information
CREATE OR REPLACE VIEW comment_details AS
SELECT 
  c.*,
  p.username,
  p.full_name,
  p.created_at as user_created_at
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id; 