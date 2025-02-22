import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  Trophy, 
  Wallet, 
  Users, 
  TrendingUp, 
  MessageSquare,
  ArrowLeft,
  Settings,
  Filter,
  Clock,
  X,
  Crown,
  Gift,
  Star,
  Zap,
  PlusCircle,
  UserPlus,
  Award,
  RefreshCw
} from 'lucide-react';
import { useNotification, NotificationType } from '../hooks/useNotification';
import { useAuth } from '../contexts/AuthContext';
import MobileFooterNav from '../components/MobileFooterNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotification();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const toast = useToast();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Force a refresh of notifications
    fetchNotifications();
  }, [currentUser, navigate, fetchNotifications]);

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Debug information
  console.log('Current notifications:', notifications);
  console.log('Filter:', filter);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    const selectedFilter = filters.find(f => f.id === filter);
    return selectedFilter?.types?.includes(notification.type);
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'event_created':
        return <PlusCircle className="w-5 h-5 text-green-400" />;
      case 'event_participation':
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      case 'event_milestone':
        return <Award className="w-5 h-5 text-yellow-400" />;
      case 'event_win':
      case 'event_loss':
      case 'new_event':
      case 'event_update':
        return <Trophy className="w-5 h-5 text-[#CCFF00]" />;
      case 'earnings':
        return <Wallet className="w-5 h-5 text-[#CCFF00]" />;
      case 'group_message':
      case 'direct_message':
      case 'group_mention':
        return <MessageSquare className="w-5 h-5 text-[#CCFF00]" />;
      case 'leaderboard_update':
        return <TrendingUp className="w-5 h-5 text-[#CCFF00]" />;
      case 'follow':
        return <Users className="w-5 h-5 text-[#CCFF00]" />;
      case 'challenge':
      case 'challenge_response':
        return <Zap className="w-5 h-5 text-[#CCFF00]" />;
      case 'group_role':
        return <Crown className="w-5 h-5 text-[#CCFF00]" />;
      case 'group_achievement':
        return <Star className="w-5 h-5 text-[#CCFF00]" />;
      case 'referral':
      case 'welcome_bonus':
        return <Gift className="w-5 h-5 text-[#CCFF00]" />;
      default:
        return <Bell className="w-5 h-5 text-[#CCFF00]" />;
    }
  };

  const getNotificationBackground = (type: NotificationType, status?: string) => {
    switch (type) {
      case 'event_created':
      case 'event_participation':
      case 'event_milestone':
      case 'new_event':
        return 'bg-green-500/10';
      case 'event_win':
        return 'bg-green-500/10';
      case 'event_loss':
        return 'bg-red-500/10';
      case 'earnings':
        return status === 'win' ? 'bg-green-500/10' : 'bg-red-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  const getNotificationContent = (notification: Notification) => {
    const { type, metadata } = notification;

    switch (type) {
      case 'event_created':
        return (
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-600">{notification.content}</p>
            {metadata?.wager_amount && (
              <p className="text-sm text-green-600 mt-1">
                Wager Amount: ₦{metadata.wager_amount.toLocaleString()}
              </p>
            )}
          </div>
        );
      
      case 'new_event':
        return (
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-600">{notification.content}</p>
            {metadata?.wager_amount && (
              <p className="text-sm text-green-600 mt-1">
                Wager Amount: ₦{metadata.wager_amount.toLocaleString()}
              </p>
            )}
          </div>
        );

      case 'event_participation':
      case 'event_milestone':
        return (
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-600">{notification.content}</p>
            {metadata?.participant_count && (
              <p className="text-sm text-blue-600 mt-1">
                Total Participants: {metadata.participant_count}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-600">{notification.content}</p>
          </div>
        );
    }
  };

  const handleChallengeResponse = async (notificationId: string, accept: boolean) => {
    try {
      // Mark notification as read
      await markAsRead(notificationId);
      
      // Show response message
      const message = accept ? 'Challenge accepted!' : 'Challenge declined';
      toast.showSuccess(message);
      
      // Update notification status locally
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? {
              ...n,
              metadata: { 
                ...n.metadata, 
                status: accept ? 'accepted' : 'declined'
              }
            }
          : n
      ));

      // Navigate to challenge if accepted
      if (accept && notifications.find(n => n.id === notificationId)?.metadata?.challenger_id) {
        navigate('/games');
      }
    } catch (error) {
      console.error('Error handling challenge response:', error);
      toast.showError('Failed to respond to challenge');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.metadata?.event_id) {
      navigate(`/events/${notification.metadata.event_id}`);
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b2e]">
      <header className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-[#CCFF00] hover:text-[#CCFF00]/80"
          >
            Mark all as read
          </button>
        </div>

        {/* Debug info - remove in production */}
        <div className="p-4 bg-black/10 text-xs text-white/60">
          <p>User ID: {currentUser.id}</p>
          <p>Total notifications: {notifications.length}</p>
          <p>Filtered notifications: {filteredNotifications.length}</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'events', 'messages', 'earnings'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === f 
                  ? 'bg-[#CCFF00] text-black' 
                  : 'bg-gray-800 text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Notifications list */}
      <div className="divide-y divide-gray-800">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/60">
            <Bell className="w-12 h-12 mb-4" />
            <p>No notifications yet</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => {
                if (notification.metadata?.event_id) {
                  navigate(`/events/${notification.metadata.event_id}`);
                }
                markAsRead(notification.id);
              }}
              className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                !notification.read_at ? 'bg-white/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#CCFF00]/10">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{notification.title}</p>
                  <p className="text-sm text-white/60">{notification.content}</p>
                  {notification.metadata?.wager_amount && (
                    <p className="text-sm text-[#CCFF00] mt-1">
                      Wager Amount: ₦{notification.metadata.wager_amount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-white/40 mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
