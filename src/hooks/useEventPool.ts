import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface EventPool {
  event_id: string;
  total_amount: number;
  admin_fee: number;
  winning_pool?: number;
  losing_pool?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export function useEventPool() {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const getEventPool = useCallback(async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_pools')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching event pool:', error);
      return null;
    }
  }, []);

  const updatePoolAmount = useCallback(async (
    eventId: string, 
    amount: number, 
    prediction: boolean
  ) => {
    setIsLoading(true);
    try {
      const { data: pool, error: fetchError } = await supabase
        .from('event_pools')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (fetchError) throw fetchError;

      const adminFeePercentage = 0.05; // 5% admin fee
      const adminFee = amount * adminFeePercentage;
      const netAmount = amount - adminFee;

      const { error: updateError } = await supabase
        .from('event_pools')
        .update({
          total_amount: pool.total_amount + amount,
          admin_fee: pool.admin_fee + adminFee,
          [prediction ? 'winning_pool' : 'losing_pool']: (prediction ? pool.winning_pool : pool.losing_pool) + netAmount
        })
        .eq('event_id', eventId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error updating pool amount:', error);
      toast.showError('Failed to update pool amount');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const distributeWinnings = useCallback(async (
    eventId: string,
    winningPrediction: boolean
  ) => {
    setIsLoading(true);
    try {
      // Get event pool and participants
      const [{ data: pool }, { data: participants }] = await Promise.all([
        supabase
          .from('event_pools')
          .select('*')
          .eq('event_id', eventId)
          .single(),
        supabase
          .from('event_participants')
          .select('*')
          .eq('event_id', eventId)
          .eq('prediction', winningPrediction)
      ]);

      if (!pool || !participants) throw new Error('Pool or participants not found');

      const winningPool = winningPrediction ? pool.winning_pool : pool.losing_pool;
      const totalWinners = participants.length;

      if (totalWinners === 0) throw new Error('No winners found');

      const winningsPerPerson = Math.floor(winningPool / totalWinners);

      // Update winner wallets
      for (const participant of participants) {
        const { error } = await supabase.rpc('update_wallet_balance', {
          p_user_id: participant.user_id,
          p_amount: winningsPerPerson
        });

        if (error) throw error;
      }

      // Update pool status
      const { error: poolError } = await supabase
        .from('event_pools')
        .update({ status: 'completed' })
        .eq('event_id', eventId);

      if (poolError) throw poolError;

      toast.showSuccess('Winnings distributed successfully');
      return true;
    } catch (error) {
      console.error('Error distributing winnings:', error);
      toast.showError('Failed to distribute winnings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    getEventPool,
    updatePoolAmount,
    distributeWinnings,
    isLoading
  };
}