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
  Zap
} from 'lucide-react';
import { useNotification, NotificationType } from '../hooks/useNotification';
import { useAuth } from '../contexts/AuthContext';
import MobileFooterNav from '../components/MobileFooterNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotification();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'events', label: 'Events', types: ['event_win', 'event_loss', 'new_event', 'event_update'] },
    { id: 'social', label: 'Social', types: ['follow', 'group_message', 'direct_message', 'group_mention'] },
    { id: 'earnings', label: 'Earnings', types: ['earnings', 'referral', 'welcome_bonus'] },
    { id: 'challenges', label: 'Challenges', types: ['challenge', 'challenge_response'] },
    { id: 'achievements', label: 'Achievements', types: ['group_achievement', 'leaderboard_update', 'group_role'] }
  ];

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
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
    if (type === 'challenge') {
      switch (status) {
        case 'pending':
          return 'bg-yellow-500/20';
        case 'live':
          return 'bg-[#CCFF00]/20';
        case 'completed':
          return 'bg-blue-500/20';
        case 'declined':
        case 'expired':
          return 'bg-red-500/20';
        default:
          return 'bg-[#242538]';
      }
    }

    switch (type) {
      case 'event_win':
      case 'earnings':
      case 'welcome_bonus':
      case 'referral':
        return 'bg-[#CCFF00]/20';
      case 'event_loss':
        return 'bg-red-500/20';
      case 'leaderboard_update':
      case 'group_role':
      case 'group_achievement':
        return 'bg-[#7C3AED]/20';
      case 'group_message':
      case 'direct_message':
      case 'group_mention':
        return 'bg-blue-500/20';
      default:
        return 'bg-[#242538]';
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    const selectedFilter = filters.find(f => f.id === filter);
    return selectedFilter?.types?.includes(notification.type);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              <p className="text-sm text-white/60">
                {notifications.filter(n => !n.read_at).length} unread
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Notifications List */}
      <div className="divide-y divide-white/10">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/60">
            <Bell className="w-12 h-12 mb-4" />
            <p>No notifications yet</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => notification.link && navigate(notification.link)}
              className={`p-4 hover:bg-white/5 transition-colors ${
                !notification.read_at ? 'bg-white/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getNotificationBackground(notification.type, notification.metadata?.status)
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white">{notification.title}</h4>
                  <p className="text-white/60 text-sm line-clamp-2">{notification.content}</p>
                  
                  {/* Challenge Actions */}
                  {notification.type === 'challenge' && notification.metadata?.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChallengeResponse(notification.id, false);
                        }}
                        className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChallengeResponse(notification.id, true);
                        }}
                        className="px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg text-sm font-medium hover:bg-[#CCFF00]/30 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  )}

                  {/* Challenge Status */}
                  {notification.type === 'challenge' && notification.metadata?.status === 'live' && (
                    <div className="flex items-center gap-2 mt-2 text-[#CCFF00] text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Live Now</span>
                    </div>
                  )}

                  {/* Amount Display */}
                  {notification.metadata?.amount && (
                    <p className="text-[#CCFF00] font-bold mt-1">
                      ₦ {notification.metadata.amount.toLocaleString()}
                      {notification.metadata.earnings && (
                        <span className="text-green-500 ml-2">
                          +₦ {notification.metadata.earnings.toLocaleString()}
                        </span>
                      )}
                    </p>
                  )}

                  {/* Timestamp and Read Status */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white/40 text-sm">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    {!notification.read_at && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-[#CCFF00] text-sm hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Notifications;