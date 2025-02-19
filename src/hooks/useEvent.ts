import { useCallback, useEffect, useState } from 'react';
import { supabase, checkConnection, withRetry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { privyDIDtoUUID } from '../utils/auth';

export interface Event {
  id: string; // This should be a UUID string
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  wager_amount: number;
  max_participants: number;
  banner_url: string;
  status: string;
  creator: {
    id: string;
    username: string;
  };
  pool: {
    total_amount: number;
    admin_fee: number;
  };
  participants: {
    prediction: boolean;
    user_id: string;
    status: string;
  }[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export function useEvent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryCount[]>([]);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchEvents = useCallback(async (searchQuery?: string) => {
    try {
      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('No connection to server');
      }

      const result = await withRetry(async () => {
        let query = supabase
          .from('events')
          .select(`
            *,
            creator:creator_id(*),
            pool:event_pools(*),
            participants:event_participants(*)
          `)
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query = query.or(`
            title.ilike.%${searchQuery}%,
            description.ilike.%${searchQuery}%,
            category.ilike.%${searchQuery}%
          `);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      });

      setEvents(result || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.showError('Failed to load events. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCategoryStats = useCallback(async () => {
    try {
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('No connection to server');
      }

      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('events')
          .select('category')
          .not('status', 'eq', 'completed');

        if (error) throw error;
        return data;
      });

      const stats = result.reduce((acc: { [key: string]: number }, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      }, {});

      const formattedStats = Object.entries(stats).map(([category, count]) => ({
        category,
        count
      }));

      setCategoryStats(formattedStats);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      toast.showError('Failed to load category statistics. Please try again.');
    }
  }, [toast]);

  const createEvent = useCallback(async (eventData: {
    title: string;
    description: string;
    category: string;
    start_time: Date;
    end_time: Date;
    wager_amount: number;
    max_participants?: number;
    banner_url?: string;
    is_private?: boolean;
    rules?: string;
  }) => {
    if (!currentUser) {
      toast.showError('Please sign in to create an event');
      return null;
    }

    try {
      setLoading(true);

      // Convert Privy DID to UUID
      const userId = privyDIDtoUUID(currentUser.id);

      const event = await withRetry(async () => {
        const { data, error } = await supabase
          .from('events')
          .insert({
            creator_id: userId,
            title: eventData.title,
            description: eventData.description,
            category: eventData.category,
            start_time: eventData.start_time.toISOString(),
            end_time: eventData.end_time.toISOString(),
            wager_amount: eventData.wager_amount,
            max_participants: eventData.max_participants || 2,
            banner_url: eventData.banner_url || null,
            status: 'pending',
            is_private: eventData.is_private || false,
            rules: eventData.rules || null
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  const joinEvent = useCallback(async (eventId: string, prediction: boolean) => {
    if (!currentUser) {
      toast.showError('Please sign in to join the event');
      return null;
    }

    try {
      setLoading(true);

      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('No connection to server');
      }

      const userId = privyDIDtoUUID(currentUser.id);

      const result = await withRetry(async () => {
        // Check if user has already joined
        const { data: existing } = await supabase
          .from('event_participants')
          .select()
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          throw new Error('You have already joined this event');
        }

        // Get event details for wager amount
        const { data: event } = await supabase
          .from('events')
          .select('wager_amount')
          .eq('id', eventId)
          .single();

        if (!event) {
          throw new Error('Event not found');
        }

        // Lock funds for wager
        const { error: fundError } = await supabase.rpc('lock_event_funds', {
          p_user_id: userId,
          p_event_id: eventId,
          p_amount: event.wager_amount
        });

        if (fundError) {
          throw new Error('Insufficient funds to join event');
        }

        // Join event
        const { data, error } = await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: userId,
            prediction,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      toast.showSuccess('Successfully joined event');
      await fetchEvents();
      return result;
    } catch (error) {
      console.error('Error joining event:', error);
      const message = error instanceof Error ? error.message : 'Failed to join event. Please check your connection and try again.';
      toast.showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast, fetchEvents]);

  useEffect(() => {
    fetchEvents();
    fetchCategoryStats();
  }, [fetchEvents, fetchCategoryStats]);

  return {
    events,
    loading,
    createEvent,
    joinEvent,
    fetchEvents,
    categoryStats,
    fetchCategoryStats
  };
}
