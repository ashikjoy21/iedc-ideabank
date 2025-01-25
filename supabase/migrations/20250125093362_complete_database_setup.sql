-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE idea_status AS ENUM ('pending', 'approved', 'rejected', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create base tables
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    bio text,
    is_admin boolean DEFAULT false,
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

CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_categories (
    idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (idea_id, category_id)
);

CREATE TABLE IF NOT EXISTS votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    value integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    UNIQUE(idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create materialized view for idea statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS idea_stats AS
SELECT 
    i.id as idea_id,
    COUNT(DISTINCT c.id) as comment_count,
    COALESCE(SUM(v.value), 0) as vote_count
FROM ideas i
LEFT JOIN comments c ON i.id = c.idea_id
LEFT JOIN votes v ON i.id = v.idea_id
GROUP BY i.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_idea_categories_idea_id ON idea_categories(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_categories_category_id ON idea_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_categories_name_lower ON categories(LOWER(name));

-- Create views for data access
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
                    'name', LOWER(c.name)
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

CREATE OR REPLACE VIEW comment_details AS
SELECT 
    c.*,
    p.username,
    p.avatar_url
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Create helper functions
CREATE OR REPLACE FUNCTION contains_category(categories jsonb, category_name text)
RETURNS boolean AS $$
BEGIN
    RETURN categories @> jsonb_build_array(jsonb_build_object('name', LOWER(category_name)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Ideas policies
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

CREATE POLICY "Authenticated users can create ideas" ON ideas
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = user_id AND
        status = 'pending'
    );

CREATE POLICY "Users can update own ideas" ON ideas
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status NOT IN ('approved', 'rejected')
    );

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- Idea categories policies
CREATE POLICY "Anyone can view idea categories" ON idea_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can insert categories for own ideas" ON idea_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ideas 
            WHERE id = idea_categories.idea_id 
            AND user_id = auth.uid()
        )
    );

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = user_id
    );

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = user_id
    );

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Grant necessary permissions
GRANT SELECT ON idea_details TO authenticated;
GRANT SELECT ON idea_details TO anon;
GRANT SELECT ON comment_details TO authenticated;
GRANT SELECT ON comment_details TO anon;
GRANT EXECUTE ON FUNCTION contains_category TO authenticated;
GRANT EXECUTE ON FUNCTION contains_category TO anon;

-- Insert default categories
INSERT INTO categories (id, name, description) VALUES 
    (gen_random_uuid(), 'technology', 'Tech-focused innovations and solutions'),
    (gen_random_uuid(), 'education', 'Learning and educational initiatives'),
    (gen_random_uuid(), 'environment', 'Environmental and sustainability projects'),
    (gen_random_uuid(), 'health', 'Health and wellness related ideas'),
    (gen_random_uuid(), 'social impact', 'Ideas that benefit society and communities')
ON CONFLICT (name) DO NOTHING;

-- Create function to refresh idea stats
CREATE OR REPLACE FUNCTION refresh_idea_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY idea_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh idea stats
CREATE TRIGGER refresh_idea_stats_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_idea_stats();

CREATE TRIGGER refresh_idea_stats_on_comment
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_idea_stats(); 