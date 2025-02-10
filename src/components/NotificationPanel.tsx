import React from 'react';
import { Bell, Check, Trophy, Wallet, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { useNotification, Notification } from '../hooks/useNotification';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotification();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_win':
      case 'event_loss':
      case 'new_event':
      case 'event_update':
        return <Trophy className="w-5 h-5 text-[#CCFF00]" />;
      case 'earnings':
        return <Wallet className="w-5 h-5 text-[#CCFF00]" />;
      case 'group_message':
        return <MessageSquare className="w-5 h-5 text-[#CCFF00]" />;
      case 'leaderboard_update':
        return <TrendingUp className="w-5 h-5 text-[#CCFF00]" />;
      case 'follow':
        return <Users className="w-5 h-5 text-[#CCFF00]" />;
      default:
        return <Bell className="w-5 h-5 text-[#CCFF00]" />;
    }
  };

  const getNotificationBackground = (type: Notification['type']) => {
    switch (type) {
      case 'event_win':
      case 'earnings':
        return 'bg-[#CCFF00]/20';
      case 'event_loss':
        return 'bg-red-500/20';
      case 'leaderboard_update':
        return 'bg-[#7C3AED]/20';
      default:
        return 'bg-[#242538]';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#1a1b2e] shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium text-[#CCFF00] hover:bg-[#CCFF00]/10 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
              <Bell className="w-12 h-12 mb-4" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors ${
                    !notification.read_at ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBackground(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{notification.title}</h4>
                      <p className="text-white/60 text-sm">{notification.content}</p>
                      {notification.metadata?.amount && (
                        <p className="text-[#CCFF00] font-bold mt-1">
                          ₦ {notification.metadata.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white/40 text-sm">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    {!notification.read_at && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-[#CCFF00] text-sm hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;