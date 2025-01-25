import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ThumbsUp, MessageSquare, Plus } from 'lucide-react';
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
  categories: { name: string }[];
}

interface CategoryDetails {
  name: string;
  description: string;
  icon_name: string;
}

export default function CategoryIdeas() {
  const { categoryName } = useParams();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetails | null>(null);

  useEffect(() => {
    if (categoryName) {
      fetchCategoryDetails();
      fetchIdeasByCategory();
    }
  }, [categoryName]);

  async function fetchCategoryDetails() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, description, icon_name')
        .eq('name', categoryName?.toLowerCase())
        .single();

      if (error) throw error;
      setCategoryDetails(data);
    } catch (error) {
      console.error('Error fetching category details:', error);
    }
  }

  async function fetchIdeasByCategory() {
    try {
      const { data, error } = await supabase
        .from('idea_details')
        .select('*')
        .contains('categories', JSON.stringify([{ name: categoryName?.toLowerCase() }]))
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

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
          <div className="flex items-center gap-2">
            <CategoryIcon 
              name={categoryDetails?.icon_name || 'Tag'} 
              className="w-8 h-8 text-yellow-500" 
            />
            <h1 className="text-3xl font-bold text-gray-900">
              {formatCategoryName(categoryDetails?.name || categoryName || '')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">{categoryDetails?.description}</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-full font-medium hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Add Idea
        </Link>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500">No ideas found in this category.</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">by {idea.username}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{idea.description}</p>

                <div className="flex items-center space-x-2 mb-4">
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

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{idea.vote_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{idea.comment_count || 0}</span>
                    </div>
                  </div>
                  <Link
                    to={`/ideas/${idea.id}`}
                    className="text-yellow-500 hover:text-yellow-600 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 