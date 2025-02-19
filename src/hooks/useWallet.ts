import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { privyDIDtoUUID } from '../utils/auth';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const initializeWallet = useCallback(async () => {
    if (!currentUser?.id) return null;

    try {
      const userId = privyDIDtoUUID(currentUser.id);
      
      const { data: existingWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        toast.showError('Failed to fetch wallet');
        throw new Error('Failed to fetch wallet');
      }

      if (existingWallet) {
        return existingWallet;
      }

      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert([
          {
            user_id: userId,
            balance: 0,
            currency: 'NGN'
          }
        ])
        .select()
        .single();

      if (createError) {
        toast.showError('Failed to create wallet');
        throw new Error('Failed to create wallet');
      }

      toast.showSuccess('Wallet created successfully');
      return newWallet;
    } catch (error) {
      console.error('Wallet initialization error:', error);
      return null;
    }
  }, [currentUser, toast]);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const walletData = await initializeWallet();
      
      if (walletData) {
        setWallet(walletData);
      } else {
        toast.showError('Unable to load wallet');
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.showError('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [initializeWallet, toast]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchWallet();
    }
  }, [currentUser, fetchWallet]);

  return {
    wallet,
    loading,
    fetchWallet
  };
}
