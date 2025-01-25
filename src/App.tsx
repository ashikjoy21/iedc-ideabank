import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth-store';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TrendingIdeas from './pages/TrendingIdeas';
import Auth from './pages/Auth';
import NewIdea from './pages/NewIdea';
import IdeaDetails from './pages/IdeaDetails';
import Profile from './pages/Profile';
import BrowseIdeas from './pages/BrowseIdeas';
import MyIdeas from './pages/MyIdeas';
import EditIdea from './pages/EditIdea';
import CategoryIdeas from './pages/CategoryIdeas';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSetup from './pages/ProfileSetup';

function App() {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {user && <Sidebar />}
        <main className={`pt-16 ${user ? 'ml-64' : ''}`}>
          <div className="p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/browse" element={<BrowseIdeas />} />
              <Route path="/my-ideas" element={<MyIdeas />} />
              <Route path="/category/:categoryName" element={<CategoryIdeas />} />
              <Route path="/edit/:id" element={<EditIdea />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/new" element={<NewIdea />} />
              <Route path="/ideas/:id" element={<IdeaDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;