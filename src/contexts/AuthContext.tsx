import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase, getUserByPrivyID } from '../lib/supabase';
import { useToast } from './ToastContext';

interface User {
  id: string;
  privy_id: string;
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
      console.log('🔴 User not authenticated or Privy user is null.');
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const privyDID = user.id; // Privy Decentralized ID
      const userUUID = user.id; // Fallback if Privy ID fails

      console.log('🟢 Fetching user profile from Supabase:', { privyDID, userUUID });

      // Fetch user by privy_id
      const { data: profile, error } = await getUserByPrivyID(privyDID, userUUID);

      if (error) {
        console.error('❌ Supabase getUserByPrivyID Error:', error);
        if (error.code !== 'PGRST116') throw error;
      }

      if (profile) {
        console.log('✅ User profile found:', profile);
        setCurrentUser({ ...profile, email: user.email });
      } else {
        console.log('⚠️ No user found. Creating a new profile...');

        // Create new user
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: userUUID,
            privy_id: privyDID,
            name: user.name || '',
            username: user.username || `user_${userUUID.slice(0, 8)}`,
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userUUID}`
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Supabase Insert Error:', createError);
          throw createError;
        }

        console.log('✅ New user created:', newProfile);
        setCurrentUser({ ...newProfile, email: user.email });
      }
    } catch (error) {
      console.error('🔥 Error refreshing user:', error);
      setCurrentUser({
        id: user.id,
        privy_id: user.id,
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
      console.log('✅ Login successful.');
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.showError('Failed to sign in. Please try again.');
    }
  }, [privyLogin, toast]);

  const logout = useCallback(async () => {
    try {
      await privyLogout();
      setCurrentUser(null);
      toast.showSuccess('Signed out successfully');
      console.log('✅ Logout successful.');
    } catch (error) {
      console.error('❌ Logout error:', error);
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
