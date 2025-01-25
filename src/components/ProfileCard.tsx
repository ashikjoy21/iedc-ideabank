import React from 'react';
import { User, Mail, Calendar, FileText, Award, Lightbulb, MessageSquare, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ProfileCardProps {
  username: string;
  full_name: string | null;
  bio: string | null;
  created_at: string;
  is_admin: boolean;
  avatar_url: string | null;
  idea_count?: number;
  vote_count?: number;
  comment_count?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCard({ 
  username, 
  full_name, 
  bio, 
  created_at, 
  is_admin,
  avatar_url,
  idea_count = 0,
  vote_count = 0,
  comment_count = 0,
  isOpen, 
  onClose 
}: ProfileCardProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-6">
          {avatar_url ? (
            <img 
              src={avatar_url} 
              alt={username} 
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="bg-yellow-100 rounded-full p-4">
              <User className="w-12 h-12 text-yellow-600" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {full_name || username}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">@{username}</p>
              {is_admin && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>

          {bio && (
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                <FileText className="w-4 h-4 mr-2" />
                <span>Bio</span>
              </div>
              <p className="text-gray-600 text-sm">{bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Lightbulb className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-sm font-semibold text-gray-900">{idea_count}</div>
              <div className="text-xs text-gray-500">Ideas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <ThumbsUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-sm font-semibold text-gray-900">{vote_count}</div>
              <div className="text-xs text-gray-500">Votes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-sm font-semibold text-gray-900">{comment_count}</div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center text-gray-600 text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>{username}</span>
            </div>

            <div className="flex items-center text-gray-600 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Joined {formatDistanceToNow(new Date(created_at))} ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 