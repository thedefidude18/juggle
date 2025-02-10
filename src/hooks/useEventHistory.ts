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
}

export function useEventHistory() {
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchHistory = useCallback(async () => {
    if (!currentUser?.id) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'get_user_event_history',
        { p_user_id: currentUser.id }
      );

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching event history:', error);
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