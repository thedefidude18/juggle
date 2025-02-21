import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { privyDIDtoUUID } from '../utils/auth';



export type NotificationType = 
  | 'event_win' 
  | 'event_loss' 
  | 'new_event' 
  | 'event_update'
  | 'event_created'        // New type for creators
  | 'event_participation'  // New type for when users join
  | 'event_milestone'      // New type for participation milestones
  | 'earnings'
  | 'follow'
  | 'group_message'
  | 'direct_message'
  | 'group_mention'
  | 'leaderboard_update'
  | 'challenge'
  | 'challenge_response'
  | 'group_achievement'
  | 'group_role'
  | 'referral'
  | 'welcome_bonus'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const toast = useToast();

  const userId = currentUser?.id ? privyDIDtoUUID(currentUser.id) : null;


  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.showError('Failed to mark notification as read');
    }
  }, [userId, toast]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.showError('Failed to mark notifications as read');
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchNotifications();

    if (userId) {
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast.showInfo(payload.new.title);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId, fetchNotifications, toast]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
}
