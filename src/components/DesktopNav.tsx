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
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Logo className="w-8 h-8 text-black" />
            <span className="text-black font-bold text-xl">Bantah</span>
          </div>

          {/* Menu */}
          <nav className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-all"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Side: Search, Notifications, and Wallet */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full max-w-xs pl-10 pr-4 py-2 bg-gray-100 text-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-500"
              />
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" />
            </div>

            {currentUser && (
              <button
                onClick={() => navigate('/wallet')}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all"
              >
                <Wallet className="w-5 h-5" />
                <span>₦ {wallet?.balance?.toLocaleString() || '0'}</span>
              </button>
            )}

            <button className="p-2 text-gray-700 hover:text-black transition-all">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopNav;