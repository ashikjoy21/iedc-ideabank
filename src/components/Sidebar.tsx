import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Lightbulb, Settings, Search, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';

interface Category {
  name: string;
  icon_name?: string;
}

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  async function checkAdminStatus() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

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

  const MenuLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`flex items-center space-x-3 p-2.5 rounded-lg transition-colors ${
        location.pathname === to
          ? 'bg-yellow-50 text-yellow-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${location.pathname === to ? 'text-yellow-500' : 'text-gray-400'}`} />
      <span className="font-medium">{children}</span>
    </Link>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Main Navigation */}
        <nav className="space-y-1">
          <MenuLink to="/" icon={LayoutDashboard}>Dashboard</MenuLink>
          <MenuLink to="/browse" icon={Search}>Browse Ideas</MenuLink>
          <MenuLink to="/my-ideas" icon={Lightbulb}>My Ideas</MenuLink>
        </nav>

        {/* Admin Section - Only shown to admins */}
        {isAdmin && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Admin
            </h2>
            <MenuLink to="/admin" icon={Shield}>Admin Dashboard</MenuLink>
          </div>
        )}

        {/* Categories */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Categories
          </h2>
          <div className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/category/${category.name.toLowerCase()}`}
                className={`block px-3 py-2 rounded-md text-sm ${
                  location.pathname === `/category/${category.name.toLowerCase()}`
                    ? 'text-yellow-700 bg-yellow-50'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </Link>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Settings
          </h2>
          <MenuLink to="/profile" icon={Settings}>Profile</MenuLink>
        </div>
      </div>
    </div>
  );
} 