import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useEventPool } from './useEventPool';
import { useWallet } from './useWallet';
import { useToast } from '../contexts/ToastContext';

interface ParticipationOptions {
  eventId: string;
  userId: string;
  prediction: boolean;
  wagerAmount: number;
}

export function useEventParticipation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { updatePoolAmount } = useEventPool();
  const { deductBalance } = useWallet();
  const toast = useToast();

  const joinEvent = useCallback(async ({
    eventId,
    userId,
    prediction,
    wagerAmount
  }: ParticipationOptions) => {
    setIsProcessing(true);
    
    try {
      // Start a Supabase transaction
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('status, max_participants, wager_amount')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Validate event status and capacity
      if (event.status !== 'active') {
        throw new Error('Event is not active');
      }

      // Check if user has already joined
      const { data: existingParticipation, error: participationError } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (existingParticipation) {
        throw new Error('Already participating in this event');
      }

      // Check participant count
      const { count, error: countError } = await supabase
        .from('event_participants')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId);

      if (countError) throw countError;
      
      if (count >= event.max_participants) {
        throw new Error('Event has reached maximum participants');
      }

      // Verify wager amount matches event requirement
      if (wagerAmount !== event.wager_amount) {
        throw new Error('Invalid wager amount');
      }

      // Deduct balance from wallet
      const deductionSuccess = await deductBalance(wagerAmount);
      if (!deductionSuccess) {
        throw new Error('Insufficient balance');
      }

      // Add participant
      const { error: insertError } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          prediction: prediction,
          status: 'active',
          wager_amount: wagerAmount
        });

      if (insertError) throw insertError;

      // Update event pool
      const poolUpdateSuccess = await updatePoolAmount(eventId, wagerAmount, prediction);
      if (!poolUpdateSuccess) {
        throw new Error('Failed to update event pool');
      }

      toast.showSuccess('Successfully joined event');
      return true;

    } catch (error) {
      console.error('Error joining event:', error);
      toast.showError(error instanceof Error ? error.message : 'Failed to join event');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [deductBalance, updatePoolAmount, toast]);

  const getParticipants = useCallback(async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          user_id,
          prediction,
          status,
          wager_amount,
          joined_at,
          users (
            name,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching participants:', error);
      return null;
    }
  }, []);

  const getUserPrediction = useCallback(async (eventId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('prediction')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.prediction;
    } catch (error) {
      console.error('Error fetching user prediction:', error);
      return null;
    }
  }, []);

  return {
    joinEvent,
    getParticipants,
    getUserPrediction,
    isProcessing
  };
}