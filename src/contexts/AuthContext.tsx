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

    const privyDID = user.id; // Example: did:privy:cm5dqsjle01hpqiuy5gskgv5w
    console.log('🟢 Fetching user profile with Privy ID:', privyDID);

    try {
      const { data: profile, error } = await getUserByPrivyID(privyDID);

      if (error) {
        console.error('❌ Supabase getUserByPrivyID Error:', error);
        throw error;
      }

      if (profile) {
        console.log('✅ User found:', profile);
        setCurrentUser(profile);
      } else {
        console.log('⚠️ No user found. Creating new profile...');

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            privy_id: privyDID, // Now stored as TEXT
            name: user.name || 'Anonymous',
            avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${privyDID}`
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error inserting new user:', insertError);
          throw insertError;
        }

        console.log('✅ New user created:', newUser);
        setCurrentUser(newUser);
      }
    } catch (error) {
      console.error('🔥 Error refreshing user:', error);
      setCurrentUser(null);
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
