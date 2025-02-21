import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface ParticipationOptions {
  eventId: string;
  userId: string;
  prediction: boolean;
  wagerAmount: number;
}

export function useEventParticipation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const joinEvent = useCallback(async ({
    eventId,
    userId,
    prediction,
    wagerAmount
  }: ParticipationOptions) => {
    setIsProcessing(true);
    
    try {
      // Check if user has already joined
      const { data: existingParticipation, error: participationError } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      if (participationError) throw participationError;

      if (existingParticipation) {
        return true; // Already participating is not an error for public events
      }

      // Rest of the join logic...
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('status, max_participants, wager_amount')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      if (event.status !== 'active') {
        throw new Error('Event is not active');
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

      toast.showSuccess('Successfully joined event');
      return true;

    } catch (error: any) {
      console.error('Error joining event:', error);
      toast.showError(error.message || 'Failed to join event');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

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
