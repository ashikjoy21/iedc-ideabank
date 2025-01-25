import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';
import ProfileCard from '../components/ProfileCard';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
  vote_count: number;
  comment_count: number;
  categories: { name: string }[];
}

export default function IdeaDetails() {
  const { id } = useParams();
  const user = useAuthStore(state => state.user);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userVote, setUserVote] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchIdea();
      fetchComments();
      if (user) {
        fetchUserVote();
      }
    }
  }, [id, user]);

  async function fetchIdea() {
    try {
      const { data, error } = await supabase
        .from('idea_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setIdea(data);
    } catch (error) {
      console.error('Error fetching idea:', error);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('comment_details')
        .select('*')
        .eq('idea_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedComments = data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        idea_id: comment.idea_id,
        username: comment.username || 'Anonymous',
        avatar_url: comment.avatar_url
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  async function fetchUserVote() {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('value')
        .eq('idea_id', id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setUserVote(data?.value || 0);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(value: number) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('votes')
        .upsert({
          idea_id: id,
          user_id: user.id,
          value: value === userVote ? 0 : value
        }, {
          onConflict: 'idea_id,user_id'
        });

      if (error) throw error;

      // Refresh the idea and user's vote
      fetchIdea();
      fetchUserVote();
    } catch (error) {
      console.error('Error voting:', error);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      // First insert the comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          idea_id: id,
          user_id: user.id,
          content: newComment.trim()
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Get the user's profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      // Format the new comment
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        idea_id: comment.idea_id,
        username: profile?.username || 'Anonymous',
        avatar_url: profile?.avatar_url
      };

      // Add the new comment to the list
      setComments([...comments, formattedComment]);
      setNewComment('');

      // Refresh idea to update comment count
      fetchIdea();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  async function fetchProfileData(username: string) {
    try {
      // Fetch basic profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      // Fetch user's ideas count
      const { count: ideaCount, error: ideaError } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (ideaError) throw ideaError;

      // Fetch user's total votes received
      const { data: votes, error: voteError } = await supabase
        .from('votes')
        .select('value')
        .eq('user_id', profile.id);

      if (voteError) throw voteError;
      const voteCount = votes?.reduce((sum, vote) => sum + (vote.value || 0), 0) || 0;

      // Fetch user's total comments
      const { count: commentCount, error: commentError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (commentError) throw commentError;

      setProfileData({
        ...profile,
        idea_count: ideaCount || 0,
        vote_count: voteCount,
        comment_count: commentCount || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  const handleUsernameClick = async (username: string) => {
    setSelectedProfile(username);
    await fetchProfileData(username);
  };

  if (loading || !idea) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Idea Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            by{' '}
            <button 
              onClick={() => handleUsernameClick(idea.username)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              {idea.username}
            </button>
          </p>
        </div>

        <p className="text-gray-600 mb-6">{idea.description}</p>

        <div className="flex items-center space-x-4 mb-6">
          {idea.categories?.map((category) => (
            <span
              key={category.name}
              className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
            >
              <CategoryIcon name={category.icon_name} className="w-3 h-3" />
              {category.name}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleVote(1)}
              className={`p-1 rounded ${userVote === 1 ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-500'}`}
              disabled={!user}
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">{idea.vote_count || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">{idea.comment_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Comments</h2>

        {user && (
          <form onSubmit={handleAddComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows={3}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Add Comment
            </button>
          </form>
        )}

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
              <div className="flex-shrink-0">
                {comment.avatar_url ? (
                  <img
                    src={comment.avatar_url}
                    alt={comment.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">
                      {comment.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUsernameClick(comment.username)}
                    className="font-medium text-gray-900 hover:text-yellow-600"
                  >
                    {comment.username}
                  </button>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {profileData && (
        <ProfileCard
          username={profileData.username}
          full_name={profileData.full_name}
          bio={profileData.bio}
          created_at={profileData.created_at}
          is_admin={profileData.is_admin}
          avatar_url={profileData.avatar_url}
          idea_count={profileData.idea_count}
          vote_count={profileData.vote_count}
          comment_count={profileData.comment_count}
          isOpen={!!selectedProfile}
          onClose={() => {
            setSelectedProfile(null);
            setProfileData(null);
          }}
        />
      )}
    </div>
  );
}