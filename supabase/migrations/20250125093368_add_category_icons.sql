-- Add icon column to categories table
ALTER TABLE categories
ADD COLUMN icon_name text NOT NULL DEFAULT 'Tag';

-- Update existing categories with specific icons
UPDATE categories SET icon_name = 'BookOpen' WHERE name = 'education';
UPDATE categories SET icon_name = 'Leaf' WHERE name = 'environment';
UPDATE categories SET icon_name = 'Heart' WHERE name = 'health';
UPDATE categories SET icon_name = 'Users' WHERE name = 'social impact';
UPDATE categories SET icon_name = 'Lightbulb' WHERE name = 'technology'; 