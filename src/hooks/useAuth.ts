import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

export function useAuth() {
  const { ready, authenticated, user, login: privyLogin, logout: privyLogout } = usePrivy();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refreshUser = useCallback(async () => {
    if (!authenticated || !user) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const userId = user.id.replace('did:privy:', ''); // ✅ FIX: Remove prefix

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId) // ✅ FIX: Search as a string, not UUID
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
        // ✅ FIX: Ensure ID is stored as TEXT
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: user.name || '',
            username: user.username || `user_${userId.slice(0, 8)}`,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
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
      setCurrentUser({
        id: userId,
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

  return {
    currentUser,
    loading: !ready || loading,
    login,
    logout,
    refreshUser
  };
}
