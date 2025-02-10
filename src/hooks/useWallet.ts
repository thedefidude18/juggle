import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface Wallet {
  id: number;
  user_id: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchWallet = useCallback(async () => {
    if (!currentUser?.id) {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      // Initialize wallet first
      const { data: walletId, error: initError } = await supabase
        .rpc('initialize_user_wallet', { 
          user_id: currentUser.id 
        });

      if (initError) {
        console.error('Error initializing wallet:', initError);
        throw initError;
      }

      if (!walletId) {
        throw new Error('Failed to initialize wallet');
      }

      // Fetch wallet details
      const { data: walletData, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (fetchError) {
        console.error('Error fetching wallet:', fetchError);
        throw fetchError;
      }

      setWallet(walletData);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const fetchTransactions = useCallback(async () => {
    if (!wallet?.id) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`wallet_id.eq.${wallet.id},recipient_wallet_id.eq.${wallet.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  }, [wallet?.id]);

  const transfer = useCallback(async (recipientId: string, amount: number) => {
    if (!wallet?.id || !currentUser) {
      toast.showError('Please sign in to make a transfer');
      return null;
    }

    try {
      const reference = `TRF_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data: recipientWallet, error: recipientError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', recipientId)
        .single();

      if (recipientError) throw recipientError;

      const { data, error } = await supabase.rpc('transfer_funds', {
        sender_wallet_id: wallet.id,
        recipient_wallet_id: recipientWallet.id,
        amount,
        reference
      });

      if (error) throw error;

      await fetchWallet();
      await fetchTransactions();
      toast.showSuccess('Transfer successful!');
      return data;
    } catch (error) {
      console.error('Error transferring funds:', error);
      toast.showError('Failed to transfer funds');
      return null;
    }
  }, [wallet?.id, currentUser, fetchWallet, fetchTransactions, toast]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (wallet?.id) {
      fetchTransactions();

      // Subscribe to wallet changes
      const walletSubscription = supabase
        .channel('wallet_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `id=eq.${wallet.id}`
        }, () => {
          fetchWallet();
        })
        .subscribe();

      // Subscribe to transaction changes
      const transactionSubscription = supabase
        .channel('transaction_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `wallet_id=eq.${wallet.id}`
        }, () => {
          fetchTransactions();
        })
        .subscribe();

      return () => {
        walletSubscription.unsubscribe();
        transactionSubscription.unsubscribe();
      };
    }
  }, [wallet?.id, fetchWallet, fetchTransactions]);

  return {
    wallet,
    transactions,
    loading,
    transfer,
    fetchWallet
  };
}