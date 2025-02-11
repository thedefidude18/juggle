import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, TrendingUp, BarChart2, Settings, Bell, Search, Wallet } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';

const DesktopNav: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { wallet } = useWallet();

  const menuItems = [
    { icon: <Trophy className="w-5 h-5" />, label: 'Events', path: '/events' },
    { icon: <Users className="w-5 h-5" />, label: 'Groups', path: '/groups' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'My Events', path: '/myevents' },
    { icon: <BarChart2 className="w-5 h-5" />, label: 'Leaderboard', path: '/leaderboard' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Menu Items */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-[#CCFF00]" />
              <span className="text-white font-bold text-xl">Bantah</span>
            </div>

            <nav className="flex items-center gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex items-center flex-1 mx-8">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#CCFF00] placeholder:text-white/50"
              />
              <Search className="w-5 h-5 text-white/50 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Wallet, Notifications, and Profile */}
          <div className="flex items-center gap-6">
            {currentUser && (
              <button
                onClick={() => navigate('/wallet')}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <Wallet className="w-5 h-5 text-[#CCFF00]" />
                <div className="text-left">
                  <p className="text-white/60 text-sm">Balance</p>
                  <p className="text-white font-medium">
                    ₦ {wallet?.balance?.toLocaleString() || '0'}
                  </p>
                </div>
              </button>
            )}

            <button
              onClick={() => navigate('/notifications')}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopNav;