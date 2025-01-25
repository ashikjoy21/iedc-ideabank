import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { ThumbsUp, MessageSquare, Check, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CategoryIcon from '../components/CategoryIcon';

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  username: string;
  vote_count: number;
  comment_count: number;
  categories: {
    name: string;
    icon_name?: string;
  }[];
}

export default function AdminDashboard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const user = useAuthStore(state => state.user);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchIdeas();
    }
  }, [isAdmin, filter]);

  async function checkAdminStatus() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async function fetchIdeas() {
    try {
      let query = supabase
        .from('idea_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleIdeaAction(ideaId: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ status })
        .eq('id', ideaId);

      if (error) throw error;

      // Update the local state
      setIdeas(ideas.map(idea => 
        idea.id === ideaId 
          ? { ...idea, status } 
          : idea
      ));
    } catch (error) {
      console.error('Error updating idea:', error);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Review and manage submitted ideas</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === status
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {ideas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <p className="text-gray-500">No ideas to review at this time.</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link 
                    to={`/ideas/${idea.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-yellow-600"
                  >
                    {idea.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">by {idea.username}</p>
                </div>
                {idea.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleIdeaAction(idea.id, 'approved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleIdeaAction(idea.id, 'rejected')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-4">{idea.description}</p>

              <div className="flex items-center space-x-4 mb-4">
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
                  <ThumbsUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{idea.vote_count || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{idea.comment_count || 0}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  idea.status === 'approved' ? 'bg-green-100 text-green-800' :
                  idea.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 