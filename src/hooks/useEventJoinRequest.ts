import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface JoinRequest {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  response_message?: string;
  created_at: string;
}

export function useEventJoinRequest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const requestToJoin = useCallback(async (
    eventId: string,
    message?: string
  ) => {
    if (!currentUser) {
      toast.showError('You must be logged in to join events');
      return false;
    }

    setIsProcessing(true);

    try {
      // Check if already requested
      const { data: existingRequest, error: checkError } = await supabase
        .from('event_join_requests')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', currentUser.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.showInfo('Join request already pending');
          return false;
        }
        if (existingRequest.status === 'accepted') {
          toast.showInfo('You are already a member of this event');
          return false;
        }
      }

      // Create new request
      const { data, error: insertError } = await supabase
        .from('event_join_requests')
        .insert([{
          event_id: eventId,
          user_id: currentUser.id,
          message: message || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.showSuccess('Join request sent successfully');
      return true;

    } catch (error: any) {
      console.error('Error requesting to join:', error);
      toast.showError(error.message || 'Failed to send join request');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, toast]);

  const getPendingRequests = useCallback(async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_join_requests')
        .select(`
          *,
          user:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      toast.showError(error.message || 'Failed to fetch pending requests');
      return [];
    }
  }, [toast]);

  const respondToRequest = useCallback(async (
    requestId: string,
    status: 'accepted' | 'declined',
    responseMessage?: string
  ) => {
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('event_join_requests')
        .update({
          status,
          response_message: responseMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.showSuccess(`Request ${status} successfully`);
      return true;
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast.showError(error.message || 'Failed to process request');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    requestToJoin,
    getPendingRequests,
    respondToRequest,
    isProcessing
  };
}
