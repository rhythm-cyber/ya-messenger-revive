import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy' | 'invisible' | 'offline';
  last_seen?: string;
  bio?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateStatus: (status: Profile['status']) => void;
  updateAvatar: (avatar: string) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile when authenticated
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch user profile:', error);
      } else if (data) {
        setProfile({ 
          ...data, 
          email: user?.email,
          status: data.status as Profile['status'] || 'offline'
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      toast.success('Welcome back!');
      return true;
    } catch (error: any) {
      toast.error('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: username,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      toast.success(`Welcome to Yahoo Messenger, ${username}!`);
      return true;
    } catch (error: any) {
      toast.error('Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  };

  const updateStatus = async (status: Profile['status']) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update status:', error);
      } else {
        setProfile(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const updateAvatar = async (avatar: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatar })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update avatar:', error);
        toast.error('Failed to update avatar');
      } else {
        setProfile(prev => prev ? { ...prev, avatar_url: avatar } : null);
        toast.success('Avatar updated successfully');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast.error('Failed to update avatar');
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update profile:', error);
        toast.error('Failed to update profile');
      } else {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        login,
        register,
        logout,
        updateStatus,
        updateAvatar,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};