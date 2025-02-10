import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  groups_joined: number;
  events_won: number;
  total_winnings: number;
  rank: number;
}

export function useLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // First, get all users with their event participation
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          username,
          avatar_url,
          event_participants (
            prediction,
            event:events (
              wager_amount,
              status
            )
          ),
          chat_participants (
            id
          )
        `);

      if (usersError) throw usersError;

      // Process user data
      const processedUsers = usersData.map(user => {
        const eventsWon = (user.event_participants || []).filter(ep => 
          ep.event.status === 'completed' && ep.prediction === true
        ).length;

        const totalWinnings = (user.event_participants || [])
          .filter(ep => ep.event.status === 'completed' && ep.prediction === true)
          .reduce((sum, ep) => sum + (ep.event.wager_amount || 0), 0);

        return {
          id: user.id,
          name: user.name || 'Anonymous User',
          username: user.username || `user_${user.id.slice(0, 8)}`,
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          groups_joined: (user.chat_participants || []).length,
          events_won: eventsWon,
          total_winnings: totalWinnings,
          rank: 0
        };
      });

      // Sort users by score (groups joined + events won)
      const sortedUsers = processedUsers.sort((a, b) => {
        const aScore = a.groups_joined * 10 + a.events_won * 20 + a.total_winnings;
        const bScore = b.groups_joined * 10 + b.events_won * 20 + b.total_winnings;
        return bScore - aScore;
      });

      // Assign ranks
      sortedUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    users,
    loading,
    fetchLeaderboard
  };
}