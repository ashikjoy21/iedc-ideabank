import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import { ThumbsUp, MessageSquare, TrendingUp, Zap, ArrowUp, Plus, LayoutDashboard, Lightbulb, Settings } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  votes: {
    value: number;
  }[];
  comments: {
    id: string;
  }[];
}

export default function Home() {
  const location = useLocation();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          profiles (username, avatar_url),
          votes (value),
          comments (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  }

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const MenuLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`flex items-center space-x-3 p-2.5 rounded-lg transition-colors ${
        isActivePath(to)
          ? 'bg-yellow-50 text-yellow-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActivePath(to) ? 'text-yellow-500' : 'text-gray-400'}`} />
      <span className="font-medium">{children}</span>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen pt-16 bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Main Navigation */}
          <nav className="space-y-1">
            <MenuLink to="/" icon={LayoutDashboard}>Dashboard</MenuLink>
            <MenuLink to="/trending" icon={TrendingUp}>Trending Ideas</MenuLink>
            <MenuLink to="/my-ideas" icon={Lightbulb}>My Ideas</MenuLink>
          </nav>

          {/* Categories */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Categories
            </h2>
            <div className="space-y-1">
              {['Innovation', 'Technology', 'Environment'].map((category) => (
                <Link
                  key={category}
                  to={`/category/${category.toLowerCase()}`}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    isActivePath(`/category/${category.toLowerCase()}`)
                      ? 'text-yellow-700 bg-yellow-50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Settings
            </h2>
            <MenuLink to="/account" icon={Settings}>Account</MenuLink>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trending Ideas</h1>
              <p className="text-gray-600 mt-2">Discover the most popular ideas in our community</p>
            </div>
            <Link
              to="/new"
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-full font-medium hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5 mr-1.5" />
              Add Idea
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                to={`/ideas/${idea.id}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{idea.title}</h3>
                    <p className="text-sm text-gray-500">by {idea.profiles.username}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {idea.status === 'trending' && (
                      <span className="bg-yellow-50 text-yellow-700 text-xs px-2.5 py-1 rounded-full flex items-center font-medium">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </span>
                    )}
                    {idea.status === 'hot' && (
                      <span className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full flex items-center font-medium">
                        <Zap className="w-3 h-3 mr-1" />
                        Hot
                      </span>
                    )}
                    {idea.status === 'rising' && (
                      <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full flex items-center font-medium">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        Rising
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{idea.description}</p>
                
                <div className="flex items-center space-x-4 text-gray-500 text-sm">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{idea.votes?.reduce((acc, vote) => acc + vote.value, 0) || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{idea.comments?.length || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}