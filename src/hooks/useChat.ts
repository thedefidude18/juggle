import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Message } from '../types/chat';

export function useChat(eventId?: string) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(
            id,
            name,
            avatar_url,
            username
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      toast.showError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-messages:${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${eventId}`
      }, payload => {
        if (payload.new.sender_id !== currentUser?.id) {
          supabase
            .from('messages')
            .select(`
              *,
              sender:sender_id(
                id,
                name,
                avatar_url,
                username
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages(prev => [...prev, data]);
              }
            });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [eventId, currentUser?.id]);

  return {
    messages,
    loading,
    error,
    sendMessage: async (content: string) => {
      if (!currentUser || !eventId) {
        throw new Error('Not authenticated or no event selected');
      }

      try {
        const { data: message, error } = await supabase
          .from('messages')
          .insert({
            event_id: eventId,
            sender_id: currentUser.id,
            content,
            type: 'text'
          })
          .select(`
            *,
            sender:sender_id(
              id,
              name,
              avatar_url,
              username
            )
          `)
          .single();

        if (error) throw error;

        setMessages(prev => [...prev, message]);
        return message;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    fetchMessages
  };
}
