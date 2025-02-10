import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, ChevronRight, Wallet, Trophy, Users, TrendingUp, BarChart2, Settings } from 'lucide-react';
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
    <div className="hidden lg:flex flex-col w-64 bg-[#242538] min-h-screen p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Logo className="w-8 h-8 text-[#CCFF00]" />
        <span className="text-white font-bold text-xl">Bantah</span>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Wallet */}
      {currentUser && (
        <div className="mt-auto">
          <button
            onClick={() => navigate('/wallet')}
            className="w-full flex items-center justify-between p-4 bg-[#1a1b2e] rounded-xl hover:bg-[#1a1b2e]/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[#CCFF00]" />
              <div className="text-left">
                <p className="text-white/60 text-sm">Balance</p>
                <p className="text-white font-bold">
                  ₦ {wallet?.balance?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DesktopNav;