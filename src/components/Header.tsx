import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MessageSquare, Bell, LogIn } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { useNotification } from '../hooks/useNotification';
import { useChat } from '../hooks/useChat';
import { Share2, ChevronRight, Wallet, Trophy, Users, TrendingUp, BarChart2 } from 'lucide-react';

interface HeaderProps {
  title?: string;
  icon?: React.ReactElement;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  icon, 
  showMenu = true, 
  onMenuClick 
}) => {
  const navigate = useNavigate();
  const { currentUser, login } = useAuth();
  const { wallet } = useWallet();
  const { unreadCount } = useNotification();
  const { chats = [] } = useChat();

  // Calculate unread messages count
  const unreadMessages = chats.reduce((count, chat) => {
    const lastMessage = chat.last_message;
    if (!lastMessage || !lastMessage.created_at) return count;

    const isUnread = !chat.participants.find(p => 
      p.user_id === currentUser?.id && 
      p.last_read >= new Date(lastMessage.created_at)
    );
    
    return count + (isUnread ? 1 : 0);
  }, 0);

  return (
    <header className="bg-[#7C3AED] text-white p-2 sticky top-0 z-10 safe-top"> {/* Reduced padding */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2"> {/* Reduced gap */}
      {showMenu ? (
            <>
              <button
                onClick={onMenuClick}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>

              <div 
                className="flex items-center gap-3 cursor-pointer" 
                onClick={() => navigate('/')}
              >
                <Logo className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              <button 
                onClick={() => navigate('/leaderboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Leaderboard"
              >
              <img src="https:/src/leaderboard.png" alt="Events Icon" className="w-6 h-6" />
              </button>
              
            </>
          ) : (
            <div className="flex items-center gap-2">
              {icon}
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
<button 
  onClick={() => navigate('/messages')}
  className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
  aria-label="Messages"
>
  <img src="/src/message.png" alt="Messages Icon" className="w-6 h-6" />
  {unreadMessages > 0 && (
    <span className="absolute -top-1 -right-1 bg-[#CCFF00] text-black text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
      {unreadMessages}
    </span>
  )}
</button>

<button 
  onClick={() => navigate('/notifications')}
  className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
  aria-label="Notifications"
>
  <img src="/src/notification.svg" alt="Notifications Icon" className="w-8 h-8" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</button>


              <button 
                onClick={() => navigate('/wallet')}
                className="bg-white text-[#7C3AED] px-3 py-1 rounded-full font-medium text-sm hover:bg-white/90 transition-colors"
              >
                ₦ {wallet?.balance?.toLocaleString() || '0.00'}
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#b3ff00] transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;