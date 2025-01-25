import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;  // This will be the email
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, full_name: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        set({ user: data.user });
      }
    } catch (error) {
      throw error;
    }
  },
  signUp: async (email, password, full_name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        set({ user: data.user });
      }
    } catch (error) {
      throw error;
    }
  },
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null });
    } catch (error) {
      throw error;
    }
  },
  fetchProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ user: null, profile: null, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();

      set({ 
        user, 
        profile, 
        loading: false
      });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      set({ user: null, profile: null, loading: false });
    }
  },
}));