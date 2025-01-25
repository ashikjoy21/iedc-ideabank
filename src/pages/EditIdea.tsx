import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';

interface IdeaForm {
  title: string;
  description: string;
  categories: string[];
}

interface Category {
  id: string;
  name: string;
}

export default function EditIdea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<IdeaForm>({
    title: '',
    description: '',
    categories: [],
  });

  useEffect(() => {
    if (user && id) {
      fetchIdea();
      fetchCategories();
    }
  }, [user, id]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchIdea() {
    try {
      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .select(`
          *,
          idea_categories (
            category_id
          )
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (ideaError) throw ideaError;
      
      if (!idea) {
        navigate('/my-ideas');
        return;
      }

      setForm({
        title: idea.title,
        description: idea.description,
        categories: idea.idea_categories.map(ic => ic.category_id),
      });
    } catch (error) {
      console.error('Error fetching idea:', error);
      navigate('/my-ideas');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Update idea
      const { error: updateError } = await supabase
        .from('ideas')
        .update({
          title: form.title,
          description: form.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Delete existing categories
      const { error: deleteError } = await supabase
        .from('idea_categories')
        .delete()
        .eq('idea_id', id);

      if (deleteError) throw deleteError;

      // Insert new categories
      if (form.categories.length > 0) {
        const { error: insertError } = await supabase
          .from('idea_categories')
          .insert(
            form.categories.map(categoryId => ({
              idea_id: id,
              category_id: categoryId,
            }))
          );

        if (insertError) throw insertError;
      }

      navigate('/my-ideas');
    } catch (error) {
      console.error('Error updating idea:', error);
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Idea</h1>
        <p className="text-gray-600 mt-2">Make changes to your idea</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.categories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm({
                        ...form,
                        categories: [...form.categories, category.id],
                      });
                    } else {
                      setForm({
                        ...form,
                        categories: form.categories.filter(id => id !== category.id),
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/my-ideas')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 