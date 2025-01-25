import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  TrendingUp, 
  Star, 
  Clock, 
  Users, 
  Award,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Lightbulb
} from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  ideaCount: number;
  voteCount: number;
  commentCount: number;
  trendingIdeas: any[];
  recentActivity: any[];
  approvalRate: number;
  changeFromLastWeek: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    ideaCount: 0,
    voteCount: 0,
    commentCount: 0,
    trendingIdeas: [],
    recentActivity: [],
    approvalRate: 0,
    changeFromLastWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    try {
      const [ideasData, votesData, commentsData, trendingData, activityData] = await Promise.all([
        fetchIdeasStats(),
        fetchVotesStats(),
        fetchCommentsStats(),
        fetchTrendingIdeas(),
        fetchRecentActivity()
      ]);

      setStats({
        ideaCount: ideasData?.length || 0,
        voteCount: votesData?.reduce((acc, vote) => acc + vote.value, 0) || 0,
        commentCount: commentsData?.length || 0,
        trendingIdeas: trendingData || [],
        recentActivity: activityData || [],
        approvalRate: calculateApprovalRate(ideasData),
        changeFromLastWeek: calculateWeeklyChange(ideasData)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchIdeasStats() {
    try {
      const { data: ideas, error: ideasError } = await supabase
        .from('idea_details')
        .select('*')
        .eq('user_id', user?.id);

      if (!ideasError) {
        return ideas;
      }
    } catch (error) {
      console.error('Error fetching ideas stats:', error);
    }
  }

  async function fetchVotesStats() {
    try {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('value')
        .eq('user_id', user?.id);

      if (!votesError) {
        return votes;
      }
    } catch (error) {
      console.error('Error fetching votes stats:', error);
    }
  }

  async function fetchCommentsStats() {
    try {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .eq('user_id', user?.id);

      if (!commentsError) {
        return comments;
      }
    } catch (error) {
      console.error('Error fetching comments stats:', error);
    }
  }

  async function fetchTrendingIdeas() {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          id,
          title,
          votes (value),
          comments (id)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error) {
        return data;
      }
    } catch (error) {
      console.error('Error fetching trending ideas:', error);
    }
  }

  async function fetchRecentActivity() {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          id,
          title,
          votes (
            created_at,
            value
          ),
          comments (
            created_at,
            content
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error) {
        return data;
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }

  function calculateApprovalRate(ideas: any[]) {
    if (!ideas?.length) return 0;
    const approved = ideas.filter(idea => idea.status === 'approved').length;
    return (approved / ideas.length) * 100;
  }

  function calculateWeeklyChange(ideas: any[]) {
    // Calculate percentage change in ideas from last week
    return 15; // Placeholder value
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.full_name || profile?.username || 'there'}!
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your ideas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Ideas */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="bg-blue-50 rounded-full p-3">
              <Lightbulb className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3 inline-block mr-1" />
              15%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">{stats.ideaCount}</h3>
            <p className="text-sm text-gray-500 mt-1">Total Ideas</p>
          </div>
        </div>

        {/* Total Votes */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="bg-yellow-50 rounded-full p-3">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUp className="w-3 h-3 inline-block mr-1" />
              8%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">{stats.voteCount}</h3>
            <p className="text-sm text-gray-500 mt-1">Total Votes</p>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="bg-green-50 rounded-full p-3">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
              0%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">{stats.commentCount}</h3>
            <p className="text-sm text-gray-500 mt-1">Comments</p>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="bg-purple-50 rounded-full p-3">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900">0%</h3>
            <p className="text-sm text-gray-500 mt-1">Approval Rate</p>
          </div>
        </div>
      </div>

      {/* Recent Activity & Trending Ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link 
              to="/activity" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 mb-6 last:mb-0">
                <div className="bg-blue-50 rounded-full p-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Ideas */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Trending Ideas</h2>
            <Link 
              to="/trending" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {stats.trendingIdeas.map((idea, index) => (
              <div key={index} className="flex items-start space-x-4 mb-6 last:mb-0">
                <div className="bg-yellow-50 rounded-full p-2">
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{idea.title}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Star className="w-3 h-3 mr-1" /> {idea.votes?.length || 0} votes
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Users className="w-3 h-3 mr-1" /> {idea.comments?.length || 0} comments
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 