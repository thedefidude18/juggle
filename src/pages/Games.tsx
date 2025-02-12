import React from 'react';
import { Gamepad2 } from 'lucide-react';
import MobileFooterNav from '../components/MobileFooterNav';
import Header from '../components/Header';
import ChallengeList from '../components/ChallengeList';

interface Game {
  id: number;
  title: string;
  image: string;
  players: number;
  prize: number;
  status: 'live' | 'upcoming' | 'ended';
  startTime?: string;
}

const Games: React.FC = () => {
  const games: Game[] = [
    {
      id: 1,
      title: "FIFA 24 Tournament",
      image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&auto=format&fit=crop",
      players: 64,
      prize: 10000,
      status: 'live'
    },
    {
      id: 2,
      title: "Call of Duty Championship",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop",
      players: 128,
      prize: 15000,
      status: 'upcoming',
      startTime: '2024-03-15T14:00:00Z'
    }
  ];

  return (
    <div className="min-h-screen bg-[#EDEDED] pb-[72px]">
      <Header title="Games" icon={<Gamepad2 className="w-6 h-6" />} showMenu={false} />

      <div className="p-4 space-y-6">
        {/* Live Challenges */}
        <ChallengeList />

        {/* Games List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-[#242538] rounded-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className="relative">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  {game.status === 'live' && (
                    <span className="bg-[#7C3AED] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">{game.title}</h3>
                <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                  <span>{game.players} Players</span>
                  {game.status === 'upcoming' && (
                    <span>
                      Starts {new Date(game.startTime!).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[#CCFF00] font-bold">₦ {game.prize.toLocaleString()}</span>
                    <span className="text-white/60 text-sm ml-2">Prize Pool</span>
                  </div>
                  <button className="bg-[#CCFF00] text-black px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition-colors">
                    {game.status === 'live' ? 'Join Now' : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Games;