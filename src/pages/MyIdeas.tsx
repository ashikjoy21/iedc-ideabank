import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { ThumbsUp, MessageSquare, Pencil, Trash, Plus, Clock, Check, X } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
  votes: {
    id: string;
    value: number;
  }[];
  comments: {
    id: string;
  }[];
  categories?: { name: string }[];
}

export default function MyIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user) {
      fetchUserIdeas();
    }
  }, [user]);

  async function fetchUserIdeas() {
    try {
      const { data, error } = await supabase
        .from('idea_details')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteIdea(ideaId: string) {
    if (window.confirm('Are you sure you want to delete this idea?')) {
      try {
        const { error } = await supabase
          .from('ideas')
          .delete()
          .eq('id', ideaId)
          .eq('user_id', user?.id);

        if (error) throw error;
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
      } catch (error) {
        console.error('Error deleting idea:', error);
      }
    }
  }

  function getStatusDetails(status: string) {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending Review',
          className: 'bg-yellow-50 text-yellow-800'
        };
      case 'approved':
        return {
          icon: Check,
          text: 'Approved',
          className: 'bg-green-50 text-green-800'
        };
      case 'rejected':
        return {
          icon: X,
          text: 'Rejected',
          className: 'bg-red-50 text-red-800'
        };
      default:
        return {
          icon: Clock,
          text: status.charAt(0).toUpperCase() + status.slice(1),
          className: 'bg-gray-50 text-gray-800'
        };
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Ideas</h1>
          <p className="text-gray-600 mt-2">Manage and track your submitted ideas</p>
        </div>
        <Link
          to="/new"
          className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Idea</span>
        </Link>
      </div>

      <div className="space-y-6">
        {ideas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
            <p className="text-gray-600 mb-4">Share your first idea with the community!</p>
            <Link
              to="/new"
              className="inline-flex items-center space-x-2 text-yellow-600 hover:text-yellow-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Idea</span>
            </Link>
          </div>
        ) : (
          ideas.map((idea) => {
            const statusDetails = getStatusDetails(idea.status);
            const StatusIcon = statusDetails.icon;

            return (
              <div
                key={idea.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${statusDetails.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusDetails.text}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {idea.status === 'pending' && (
                          <Link
                            to={`/edit/${idea.id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => deleteIdea(idea.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <Link to={`/ideas/${idea.id}`} className="block">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-yellow-600">
                        {idea.title}
                      </h3>
                    </Link>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{idea.description}</p>

                  <div className="flex items-center space-x-2 mb-4">
                    {idea.categories?.map((category) => (
                      <span
                        key={category.name}
                        className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{idea.votes?.reduce((acc, vote) => acc + (vote.value || 0), 0) || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{idea.comments?.length || 0}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 