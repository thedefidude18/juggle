import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface EventHistoryItem {
  id: string;
  type: 'challenge' | 'group';
  title: string;
  description?: string;
  outcome?: 'won' | 'lost';
  amount: number;
  earnings?: number;
  date: string;
  start_time: string;
  end_time: string;
  opponent_name?: string;
  opponent_avatar_url?: string;
  group_name?: string;
  group_avatar_url?: string;
  match_status: 'matched' | 'waiting' | 'cancelled' | 'completed';
  matched_with?: {
    name: string;
    avatar_url: string;
    prediction: boolean;
  };
  category: string;
  is_editable: boolean;
  is_creator: boolean; // New field to indicate if user created this event
  participant_count?: number; // New field to show number of participants
}

export function useEventHistory() {
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [createdEvents, setCreatedEvents] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchHistory = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      // Fetch events created by the user
      const { data: createdEventsData, error: createdEventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          category,
          start_time,
          end_time,
          status,
          creator_id,
          is_private,
          wager_amount,
          created_at,
          updated_at,
          event_participants (
            count
          )
        `)
        .eq('creator_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (createdEventsError) throw createdEventsError;

      // Transform created events data
      const transformedCreatedEvents = createdEventsData.map((event): EventHistoryItem => {
        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        let matchStatus: EventHistoryItem['match_status'] = 'waiting';
        if (now > endTime) {
          matchStatus = 'completed';
        } else if (event.status === 'cancelled') {
          matchStatus = 'cancelled';
        }

        return {
          id: event.id,
          type: event.is_private ? 'challenge' : 'group',
          title: event.title,
          description: event.description,
          category: event.category,
          amount: event.wager_amount,
          date: event.created_at,
          start_time: event.start_time,
          end_time: event.end_time,
          match_status: matchStatus,
          is_editable: startTime > now,
          is_creator: true,
          participant_count: event.event_participants?.[0]?.count || 0
        };
      });

      setCreatedEvents(transformedCreatedEvents);

      // Fetch participated events (existing logic)
      const { data: participations, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          prediction,
          wager_amount,
          matching_status,
          created_at,
          events (
            id,
            title,
            description,
            category,
            start_time,
            end_time,
            status,
            creator_id,
            is_private,
            wager_amount,
            created_at,
            updated_at
          ),
          bet_matches (
            yes_participant_id,
            no_participant_id,
            wager_amount,
            status,
            event_participants (
              user_id,
              users (
                id,
                name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedHistory = participations.map((participation): EventHistoryItem => {
        const event = participation.events;
        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);
        
        const isEditable = event.creator_id === currentUser.id && 
                          startTime > now && 
                          participation.matching_status !== 'matched';

        let matchStatus: EventHistoryItem['match_status'] = 'waiting';
        if (participation.matching_status === 'matched') {
          matchStatus = 'matched';
        } else if (now > endTime) {
          matchStatus = 'completed';
        } else if (event.status === 'cancelled') {
          matchStatus = 'cancelled';
        }

        const matchInfo = participation.bet_matches?.[0];
        const opponentParticipant = matchInfo?.event_participants?.find(
          ep => ep.user_id !== currentUser.id
        );

        return {
          id: event.id,
          type: event.is_private ? 'challenge' : 'group',
          title: event.title,
          description: event.description,
          category: event.category,
          amount: participation.wager_amount,
          date: event.created_at,
          start_time: event.start_time,
          end_time: event.end_time,
          match_status: matchStatus,
          opponent_name: opponentParticipant?.users?.name,
          opponent_avatar_url: opponentParticipant?.users?.avatar_url,
          is_editable: isEditable,
          is_creator: event.creator_id === currentUser.id,
          ...(matchStatus === 'completed' && {
            outcome: determineOutcome(participation, matchInfo)
          }),
          ...(matchStatus === 'matched' && {
            matched_with: {
              name: opponentParticipant?.users?.name || '',
              avatar_url: opponentParticipant?.users?.avatar_url || '',
              prediction: opponentParticipant?.prediction || false
            }
          })
        };
      });

      setHistory(transformedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.showError('Failed to load event history');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const editEvent = useCallback(async (
    eventId: string, 
    updates: {
      title?: string;
      description?: string;
      start_time?: string;
      end_time?: string;
      category?: string;
    }
  ) => {
    if (!currentUser?.id) return;

    try {
      const event = history.find(e => e.id === eventId);
      
      if (!event?.is_editable) {
        throw new Error('Event cannot be edited');
      }

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .eq('creator_id', currentUser.id);

      if (error) throw error;

      toast.showSuccess('Event updated successfully');
      await fetchHistory();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.showError('Failed to update event');
    }
  }, [currentUser?.id, history, toast, fetchHistory]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const subscription = supabase
      .channel('event_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_participants',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, fetchHistory]);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getStats = useCallback(() => {
    const stats = {
      totalEvents: history.length,
      totalWins: history.filter(e => e.outcome === 'won').length,
      totalLosses: history.filter(e => e.outcome === 'lost').length,
      totalEarnings: history.reduce((sum, e) => sum + (e.earnings || 0), 0),
      totalWagered: history.reduce((sum, e) => sum + e.amount, 0),
      winRate: 0
    };

    const completedEvents = history.filter(e => e.outcome);
    stats.winRate = completedEvents.length > 0 
      ? (stats.totalWins / completedEvents.length) * 100 
      : 0;

    return stats;
  }, [history]);

  return {
    history,
    createdEvents,
    loading,
    getStats,
    editEvent,
    fetchHistory
  };
}

// Helper function to determine outcome
function determineOutcome(
  participation: any,
  matchInfo: any
): 'won' | 'lost' | undefined {
  if (!matchInfo || matchInfo.status !== 'completed') return undefined;
  
  const userPrediction = participation.prediction;
  const eventOutcome = matchInfo.outcome;
  
  if (eventOutcome === null) return undefined;
  return userPrediction === eventOutcome ? 'won' : 'lost';
}
