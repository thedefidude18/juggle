import React from 'react';
import { Share2, ChevronRight, Wallet, Trophy, Users, TrendingUp, BarChart2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';
import MobileFooterNav from '../components/MobileFooterNav';
import UserRankBadge from '../components/UserRankBadge';

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { wallet } = useWallet();
  const navigate = useNavigate();

  const stats = [
    {
      icon: <Wallet className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Total Earnings',
      value: `₦ ${wallet?.balance.toLocaleString() || '0'}`
    },
    {
      icon: <Trophy className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Win Rate',
      value: '75%'
    },
    {
      icon: <Users className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Groups Joined',
      value: '12'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[#CCFF00]" />,
      label: 'Active Bets',
      value: '8'
    }
  ];

  const menuItems = [
    {
      label: 'Profile Settings',
      path: '/settings/profile'
    },
    {
      label: 'Settings',
      path: '/settings'
    },
    {
      label: 'Refer & Earn',
      path: '/referral'
    },
    {
      label: 'Privacy & Security',
      path: '/settings/privacy'
    },
    {
      label: 'Help & Support',
      path: '/help'
    }
  ];

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${currentUser?.username}'s Profile`,
        text: `Check out my profile on Bantah!`,
        url: window.location.href
      });
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/leaderboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Info */}
        <div className="bg-[#242538] rounded-xl p-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative flex-shrink-0">
              <img
                src={currentUser?.avatar_url}
                alt={currentUser?.name}
                className="w-24 h-24 rounded-full border-2 border-[#CCFF00]/20"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#242538] shadow-lg px-3 py-1.5 rounded-full border border-[#CCFF00]/20 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-[#CCFF00] text-sm font-medium">
                    {currentUser?.followers_count || 0}
                  </span>
                  <span className="text-white/60 text-sm">
                    followers
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{currentUser?.name}</h2>
                {currentUser?.rank && (
                  <UserRankBadge rank={currentUser.rank} size="md" />
                )}
              </div>
              <p className="text-white/60 text-lg">@{currentUser?.username}</p>
              {currentUser?.bio && (
                <p className="text-white/80 mt-2">{currentUser.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-[#1a1b2e] rounded-xl p-4 hover:bg-[#1a1b2e]/80 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-white/60 text-sm">{stat.label}</span>
                </div>
                <p className="text-white font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-[#242538] rounded-xl overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
            >
              <span>{item.label}</span>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full p-4 bg-[#242538] text-red-500 rounded-xl font-medium hover:bg-[#2f3049] transition-colors"
        >
          Logout
        </button>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Profile;