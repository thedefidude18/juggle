import React, { useState } from 'react';
import { BarChart2, Trophy, Users, Wallet } from 'lucide-react';
import MobileFooterNav from '../components/MobileFooterNav';
import ProfileCard from '../components/ProfileCard';
import { useLeaderboard } from '../hooks/useLeaderboard';

const Leaderboard: React.FC = () => {
  const { users, loading } = useLeaderboard();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const topUsers = users.slice(0, 3);
  const otherUsers = users.slice(3);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      {/* Header */}
      <header className="bg-[#EDEDED] text-[#000000] p-4 sticky top-0 z-10 safe-top flex justify-center items-center relative">  <button
    onClick={() => window.history.back()}
    className="absolute left-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30"
  >
    {/* Use an appropriate back arrow icon here */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  </button>
  <div className="flex items-center gap-2">
    <Trophy className="w-6 h-6" />
    <h1 className="text-xl font-bold">Leaderboard</h1>
  </div>
</header>


      {/* Top Winners */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {topUsers.map((user) => (
            <div
              key={user.id}
              className="bg-[#242538] p-6 rounded-xl relative overflow-hidden cursor-pointer"
              onClick={() => handleUserClick(user.id)}
            >
              <div className="absolute top-3 right-3">
                {user.rank === 1 && <Trophy className="w-6 h-6 text-[#FFD700]" />}
                {user.rank === 2 && <Trophy className="w-6 h-6 text-[#C0C0C0]" />}
                {user.rank === 3 && <Trophy className="w-6 h-6 text-[#CD7F32]" />}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-white font-medium">{user.name}</h3>
                  <p className="text-white/60 text-sm">{user.username}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Groups Joined</span>
                  <span className="text-[#CCFF00] font-bold">
                    {user.groups_joined}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Events Won</span>
                  <span className="text-white font-medium">{user.events_won}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Winnings</span>
                  <span className="text-[#CCFF00] font-bold">
                    ₦ {user.total_winnings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-[#242538] rounded-xl">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-semibold">All Players</h2>
          </div>
          <div className="divide-y divide-white/10">
            {otherUsers.map((user) => (
              <div 
                key={user.id} 
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5"
                onClick={() => handleUserClick(user.id)}
              >
                <span className="text-white/60 font-medium w-6 text-center">
                  {user.rank}
                </span>
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{user.name}</h3>
                  <p className="text-white/60 text-sm">{user.username}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[#CCFF00]">
                      <Users className="w-4 h-4" />
                      <span className="font-bold">{user.groups_joined}</span>
                    </div>
                    <p className="text-white/60 text-xs">Groups</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[#CCFF00]">
                      <Trophy className="w-4 h-4" />
                      <span className="font-bold">{user.events_won}</span>
                    </div>
                    <p className="text-white/60 text-xs">Wins</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#CCFF00] font-bold">
                      ₦ {user.total_winnings.toLocaleString()}
                    </p>
                    <p className="text-white/60 text-xs">Winnings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedUserId && (
        <ProfileCard 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}

      <MobileFooterNav />
    </div>
  );
};

export default Leaderboard;