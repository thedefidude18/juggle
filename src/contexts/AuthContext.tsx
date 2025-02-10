import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface User {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, authenticated, user, login: privyLogin, logout: privyLogout } = usePrivy();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refreshUser = useCallback(async () => {
    if (!authenticated || !user) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      // Initialize user wallet first
      const { data: walletId, error: walletError } = await supabase
        .rpc('initialize_user_wallet', { 
          user_id: user.id 
        });

      if (walletError) {
        console.error('Error initializing wallet:', walletError);
      }

      // Get user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        setCurrentUser({
          ...profile,
          email: user.email
        });
      } else {
        // Initialize user if not exists
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            name: user.name || '',
            username: user.username || `user_${user.id.slice(0, 8)}`,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
          })
          .select()
          .single();

        if (createError) throw createError;
        setCurrentUser({
          ...newProfile,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Set minimal user data on error
      setCurrentUser({
        id: user.id,
        email: user.email
      });
    } finally {
      setLoading(false);
    }
  }, [authenticated, user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async () => {
    try {
      await privyLogin();
    } catch (error) {
      console.error('Login error:', error);
      toast.showError('Failed to sign in. Please try again.');
    }
  }, [privyLogin, toast]);

  const logout = useCallback(async () => {
    try {
      await privyLogout();
      setCurrentUser(null);
      toast.showSuccess('Signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.showError('Failed to sign out. Please try again.');
    }
  }, [privyLogout, toast]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading: !ready || loading,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};