import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';

interface Category {
  id: string;
  name: string;
}

export default function NewIdea() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Insert the idea with pending status
      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .insert([
          {
            title,
            description,
            user_id: user.id,
            status: 'pending' // Explicitly set status to pending
          },
        ])
        .select()
        .single();

      if (ideaError) throw ideaError;

      // Insert category relationships
      if (selectedCategories.length > 0) {
        const { error: categoryError } = await supabase
          .from('idea_categories')
          .insert(
            selectedCategories.map((categoryId) => ({
              idea_id: idea.id,
              category_id: categoryId,
            }))
          );

        if (categoryError) throw categoryError;
      }

      setSubmitted(true);
      // Navigate to My Ideas page after 3 seconds
      setTimeout(() => {
        navigate('/my-ideas');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-50 text-green-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-2">Idea Submitted Successfully!</h2>
          <p className="text-green-700">
            Your idea has been submitted and is pending admin approval. 
            You'll be redirected to your ideas page in a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Share Your Idea</h1>
        <p className="text-gray-600 mt-2">
          Submit your idea for review. Once approved, it will be visible to the community.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-blue-50 text-blue-700 p-4 rounded-md mb-6">
        <p className="text-sm">
          <strong>Note:</strong> All ideas go through an approval process to ensure quality and relevance.
          You'll be notified once your idea is approved.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  value={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category.id]);
                    } else {
                      setSelectedCategories(
                        selectedCategories.filter((id) => id !== category.id)
                      );
                    }
                  }}
                  className="rounded text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}