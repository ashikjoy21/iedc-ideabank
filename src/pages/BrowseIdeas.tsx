import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ThumbsUp, MessageSquare, TrendingUp, Zap, ArrowUp, Plus, Search, Filter } from 'lucide-react';
import CategoryIcon from '../components/CategoryIcon';

interface Idea {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
  username: string;
  avatar_url: string;
  vote_count: number;
  comment_count: number;
  categories: { name: string }[];
}

interface Category {
  name: string;
  icon_name: string;
}

export default function BrowseIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular');
  const [categories, setCategories] = useState<{ name: string }[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [selectedCategory, sortBy]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, icon_name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchIdeas() {
    try {
      let query = supabase
        .from('idea_details')
        .select('*')
        .eq('status', 'approved');

      if (selectedCategory !== 'all') {
        query = query.contains('categories', JSON.stringify([{ name: selectedCategory.toLowerCase() }]));
      }

      if (sortBy === 'popular') {
        query = query.order('vote_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
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

  function formatCategoryName(name: string) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Ideas</h1>
          <p className="text-gray-600 mt-2">Discover and explore innovative ideas from our community</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-full font-medium hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Add Idea
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -mt-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {formatCategoryName(category.name)}
                </option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No ideas found matching your criteria.</p>
          </div>
        ) : (
          filteredIdeas.map((idea) => (
            <Link
              key={idea.id}
              to={`/ideas/${idea.id}`}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{idea.title}</h3>
                  <p className="text-sm text-gray-500">by {idea.username}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {idea.categories?.map((category) => (
                    <span
                      key={category.name}
                      className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                    >
                      <CategoryIcon name={category.icon_name} className="w-3 h-3" />
                      {formatCategoryName(category.name)}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{idea.description}</p>
              
              <div className="flex items-center space-x-4 text-gray-500 text-sm">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{idea.vote_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{idea.comment_count || 0}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 