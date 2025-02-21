import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface EventHistoryItem {
  id: string;
  type: 'challenge' | 'group';
  title: string;
  outcome: 'won' | 'lost';
  amount: number;
  earnings?: number;
  date: string;
  opponent_name?: string;
  opponent_avatar_url?: string;
  group_name?: string;
  group_avatar_url?: string;
  match_status?: 'matched' | 'waiting' | 'cancelled';
  matched_with?: {
    name: string;
    avatar_url: string;
    prediction: boolean;
  };
}

export function useEventHistory() {
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchHistory = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          prediction,
          wager_amount,
          matching_status,
          events (
            title,
            category
          ),
          bet_matches (
            yes_participant_id,
            no_participant_id,
            wager_amount,
            status,
            event_participants (
              user_id,
              users (
                name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory(data.map(transformToHistoryItem));
    } catch (error) {
      toast.showError('Failed to load event history');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const getStats = useCallback(() => {
    const stats = {
      totalEvents: history.length,
      totalWins: history.filter(e => e.outcome === 'won').length,
      totalLosses: history.filter(e => e.outcome === 'lost').length,
      totalEarnings: history.reduce((sum, e) => sum + (e.earnings || 0), 0),
      totalWagered: history.reduce((sum, e) => sum + e.amount, 0),
      winRate: 0
    };

    stats.winRate = stats.totalEvents > 0 
      ? (stats.totalWins / stats.totalEvents) * 100 
      : 0;

    return stats;
  }, [history]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    fetchHistory,
    getStats
  };
}
