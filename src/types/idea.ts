export interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  vote_count: number;
  comment_count: number;
  categories: { name: string }[];
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  idea_id: string;
  username: string;
  avatar_url: string | null;
} 