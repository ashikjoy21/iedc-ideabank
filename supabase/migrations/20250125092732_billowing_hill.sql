/*
  # Initial Schema for IdeaBank Platform

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - username (text)
      - full_name (text)
      - avatar_url (text)
      - bio (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - ideas
      - id (uuid)
      - title (text)
      - description (text)
      - user_id (uuid, references profiles)
      - status (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - categories
      - id (uuid)
      - name (text)
      - description (text)
      - created_at (timestamp)
    
    - idea_categories
      - idea_id (uuid, references ideas)
      - category_id (uuid, references categories)
    
    - votes
      - id (uuid)
      - idea_id (uuid, references ideas)
      - user_id (uuid, references profiles)
      - value (integer)
      - created_at (timestamp)
    
    - comments
      - id (uuid)
      - idea_id (uuid, references ideas)
      - user_id (uuid, references profiles)
      - content (text)
      - parent_id (uuid, self-reference)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- First, let's create the status type to ensure consistency
CREATE TYPE idea_status AS ENUM ('pending', 'approved', 'rejected', 'in_progress', 'completed');

-- Create tables
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status idea_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE idea_categories (
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, category_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  value integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add this new policy for profile insertion
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ideas policies
CREATE POLICY "Ideas are viewable by everyone" ON ideas
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ideas" ON ideas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own ideas" ON ideas
  FOR UPDATE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON categories
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'admin'
  ));

-- Idea categories policies
CREATE POLICY "Idea categories are viewable by everyone" ON idea_categories
  FOR SELECT USING (true);

CREATE POLICY "Users can manage categories for own ideas" ON idea_categories
  USING (EXISTS (
    SELECT 1 FROM ideas WHERE id = idea_id AND user_id = auth.uid()
  ));

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Add a view to calculate vote counts for ideas
CREATE OR REPLACE VIEW idea_stats AS
SELECT 
  i.id,
  COUNT(DISTINCT c.id) as comment_count,
  COALESCE(SUM(v.value), 0) as vote_count
FROM ideas i
LEFT JOIN comments c ON c.idea_id = i.id
LEFT JOIN votes v ON v.idea_id = i.id
GROUP BY i.id;

-- Add indexes for better performance
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_idea_categories_idea_id ON idea_categories(idea_id);
CREATE INDEX idx_votes_idea_id ON votes(idea_id);
CREATE INDEX idx_comments_idea_id ON comments(idea_id);

-- Add some default categories
INSERT INTO categories (id, name, description) VALUES
  (gen_random_uuid(), 'Social Impact', 'Ideas that benefit society and communities'),
  (gen_random_uuid(), 'Technology', 'Tech-focused innovations and solutions'),
  (gen_random_uuid(), 'Education', 'Learning and educational initiatives'),
  (gen_random_uuid(), 'Environment', 'Environmental and sustainability projects'),
  (gen_random_uuid(), 'Health', 'Health and wellness related ideas')
ON CONFLICT (name) DO NOTHING;

-- Update existing categories to ensure consistent casing
UPDATE categories
SET name = LOWER(name)
WHERE name != LOWER(name);

-- Add policy for idea_categories insertion
CREATE POLICY "Users can insert categories for own ideas" ON idea_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE id = idea_categories.idea_id 
      AND user_id = auth.uid()
    )
  );

-- Add policy for idea_categories deletion
CREATE POLICY "Users can delete categories for own ideas" ON idea_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE id = idea_categories.idea_id 
      AND user_id = auth.uid()
    )
  );

-- First, update any existing rows to have valid status
UPDATE ideas 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'approved', 'rejected', 'in_progress', 'completed');

-- Now we can safely update the constraint
ALTER TABLE ideas 
  DROP CONSTRAINT IF EXISTS ideas_status_check;

ALTER TABLE ideas 
  ADD CONSTRAINT ideas_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed'));

-- Set default status to pending
ALTER TABLE ideas ALTER COLUMN status SET DEFAULT 'pending';

-- Add admin policies
CREATE POLICY "Admins can update any idea" ON ideas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND is_admin = true
    )
  );

-- Make sure all existing ideas have valid categories
INSERT INTO categories (id, name, description)
VALUES 
  (gen_random_uuid(), 'technology', 'Tech-focused innovations and solutions'),
  (gen_random_uuid(), 'education', 'Learning and educational initiatives'),
  (gen_random_uuid(), 'environment', 'Environmental and sustainability projects'),
  (gen_random_uuid(), 'health', 'Health and wellness related ideas'),
  (gen_random_uuid(), 'social impact', 'Ideas that benefit society and communities')
ON CONFLICT (name) DO NOTHING;

-- For existing ideas table, if it exists
ALTER TABLE ideas 
  ALTER COLUMN status TYPE idea_status USING status::idea_status;