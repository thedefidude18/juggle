import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export function useWallet() {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const getBalance = useCallback(async () => {
    if (!currentUser?.id) return 0;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .single();

      if (error) throw error;
      return data?.balance || 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }, [currentUser?.id]);

  const deductBalance = useCallback(async (amount: number) => {
    if (!currentUser?.id) return false;
    
    try {
      setIsLoading(true);
      
      // First, check current balance
      const { data: wallet, error: balanceError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .single();

      if (balanceError) throw balanceError;
      
      if (!wallet || wallet.balance < amount) {
        toast.showError('Insufficient balance');
        return false;
      }

      // Update balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error deducting balance:', error);
      toast.showError('Failed to process transaction');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, toast]);

  const initializeWallet = useCallback(async () => {
    if (!currentUser?.id) return null;
    
    try {
      const { data, error } = await supabase
        .rpc('initialize_user_wallet', { user_id: currentUser.id });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing wallet:', error);
      return null;
    }
  }, [currentUser?.id]);

  return {
    getBalance,
    deductBalance,
    initializeWallet,
    isLoading
  };
}
