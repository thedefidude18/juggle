import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Trophy, Calendar } from 'lucide-react';

interface Challenge {
  id: string;
  challenger: {
    name: string;
    avatar_url: string;
  };
  challenged: {
    name: string;
    avatar_url: string;
  };
  amount: number;
  type: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'ended' | 'scheduled';
  winner?: {
    name: string;
    avatar_url: string;
  };
}

const ChallengeList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'ended' | 'scheduled'>('active');

  // Mock data with 5 challenges per category
  const challenges: Challenge[] = [
    // Active Challenges
    {
      id: '1',
      challenger: {
        name: 'John Doe',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
      },
      challenged: {
        name: 'Jane Smith',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'
      },
      amount: 5000,
      type: 'FIFA 24 Match',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      status: 'active'
    },
    {
      id: '2',
      challenger: {
        name: 'Mike Johnson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike'
      },
      challenged: {
        name: 'Sarah Wilson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
      },
      amount: 7500,
      type: 'Call of Duty: Warzone',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 45 * 60000).toISOString(),
      status: 'active'
    },
    {
      id: '3',
      challenger: {
        name: 'Alex Brown',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex'
      },
      challenged: {
        name: 'Emma Davis',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma'
      },
      amount: 10000,
      type: 'NBA 2K24 Match',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
      status: 'active'
    },
    {
      id: '4',
      challenger: {
        name: 'David Lee',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
      },
      challenged: {
        name: 'Lisa Chen',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa'
      },
      amount: 15000,
      type: 'Mortal Kombat 1',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 20 * 60000).toISOString(),
      status: 'active'
    },
    {
      id: '5',
      challenger: {
        name: 'Chris Taylor',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris'
      },
      challenged: {
        name: 'Maria Garcia',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
      },
      amount: 12000,
      type: 'Street Fighter 6',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 40 * 60000).toISOString(),
      status: 'active'
    },

    // Ended Challenges
    {
      id: '6',
      challenger: {
        name: 'Tom Wilson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom'
      },
      challenged: {
        name: 'James Moore',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james'
      },
      amount: 8000,
      type: 'FIFA 24 Tournament',
      created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 60 * 60000).toISOString(),
      status: 'ended',
      winner: {
        name: 'Tom Wilson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom'
      }
    },
    {
      id: '7',
      challenger: {
        name: 'Ryan Cooper',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryan'
      },
      challenged: {
        name: 'Kevin White',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin'
      },
      amount: 20000,
      type: 'Call of Duty League Match',
      created_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      status: 'ended',
      winner: {
        name: 'Kevin White',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kevin'
      }
    },
    {
      id: '8',
      challenger: {
        name: 'Daniel Kim',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=daniel'
      },
      challenged: {
        name: 'Sophie Chen',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie'
      },
      amount: 15000,
      type: 'NBA 2K24 Championship',
      created_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
      status: 'ended',
      winner: {
        name: 'Sophie Chen',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie'
      }
    },
    {
      id: '9',
      challenger: {
        name: 'Lucas Martinez',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas'
      },
      challenged: {
        name: 'Isabella Silva',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabella'
      },
      amount: 25000,
      type: 'Street Fighter Tournament',
      created_at: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
      status: 'ended',
      winner: {
        name: 'Lucas Martinez',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas'
      }
    },
    {
      id: '10',
      challenger: {
        name: 'Oliver Brown',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oliver'
      },
      challenged: {
        name: 'Emma Wilson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emmaw'
      },
      amount: 18000,
      type: 'Mortal Kombat Championship',
      created_at: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
      expires_at: new Date(Date.now() - 5 * 60 * 60000).toISOString(),
      status: 'ended',
      winner: {
        name: 'Emma Wilson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emmaw'
      }
    },

    // Scheduled Challenges
    {
      id: '11',
      challenger: {
        name: 'William Taylor',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=william'
      },
      challenged: {
        name: 'Sophia Lee',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia'
      },
      amount: 10000,
      type: 'FIFA 24 Championship',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
      status: 'scheduled'
    },
    {
      id: '12',
      challenger: {
        name: 'Ethan Rodriguez',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ethan'
      },
      challenged: {
        name: 'Ava Thompson',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ava'
      },
      amount: 30000,
      type: 'Call of Duty Tournament',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60000).toISOString(),
      status: 'scheduled'
    },
    {
      id: '13',
      challenger: {
        name: 'Mason Clark',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mason'
      },
      challenged: {
        name: 'Charlotte White',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlotte'
      },
      amount: 22000,
      type: 'NBA 2K24 League Match',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 60 * 60000).toISOString(),
      status: 'scheduled'
    },
    {
      id: '14',
      challenger: {
        name: 'Henry Garcia',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry'
      },
      challenged: {
        name: 'Victoria Kim',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=victoria'
      },
      amount: 17000,
      type: 'Street Fighter League',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 96 * 60 * 60000).toISOString(),
      status: 'scheduled'
    },
    {
      id: '15',
      challenger: {
        name: 'Sebastian Lopez',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sebastian'
      },
      challenged: {
        name: 'Zoe Martin',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zoe'
      },
      amount: 25000,
      type: 'Mortal Kombat Tournament',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 120 * 60 * 60000).toISOString(),
      status: 'scheduled'
    }
  ];

  const filteredChallenges = challenges.filter(challenge => challenge.status === activeTab);

  const getTabIcon = (tab: typeof activeTab) => {
    switch (tab) {
      case 'active':
        return <Zap className="w-4 h-4" />;
      case 'ended':
        return <Trophy className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderChallenge = (challenge: Challenge) => {
    const isEnded = challenge.status === 'ended';
    const isScheduled = challenge.status === 'scheduled';
    const volume = challenge.amount * 2; // Total volume is twice the wager amount

    return (
      <div
        key={challenge.id}
        onClick={() => navigate(`/games/challenge/${challenge.id}`)}
        className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          {/* Wager/Volume */}
          <div className="bg-[#CCFF00]/20 text-[#CCFF00] px-4 py-2 rounded-lg font-bold whitespace-nowrap">
            ₦{challenge.amount.toLocaleString()}/₦{volume.toLocaleString()}
          </div>

          {/* Event Info */}
          <div className="flex-1 flex flex-col items-center">
            <h3 className="text-white font-medium text-center">{challenge.type}</h3>
            <div className="flex items-center gap-2 mt-1">
              {isEnded && challenge.winner && (
                <span className="text-[#CCFF00]">
                  Winner: {challenge.winner.name}
                </span>
              )}
              {isScheduled && (
                <span className="text-white/60 text-sm">
                  Starts: {new Date(challenge.expires_at).toLocaleString()}
                </span>
              )}
              {!isScheduled && !isEnded && (
                <span className="text-white/60 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTimeLeft(challenge.expires_at)}
                </span>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center gap-2">
            {/* Challenger with ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-[#CCFF00] animate-pulse"></div>
              <img
                src={challenge.challenger.avatar_url}
                alt={challenge.challenger.name}
                className="w-10 h-10 rounded-full"
              />
            </div>
            <div className="text-[#CCFF00] font-bold">VS</div>
            <img
              src={challenge.challenged.avatar_url}
              alt={challenge.challenged.name}
              className="w-10 h-10 rounded-full"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#242538] rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['active', 'ended', 'scheduled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === tab
                ? 'text-[#CCFF00] border-b-2 border-[#CCFF00]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {getTabIcon(tab)}
            <span className="capitalize">{tab}</span>
            <span className="bg-[#1a1b2e] text-white/60 text-sm px-2 py-0.5 rounded-full">
              {challenges.filter(c => c.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Challenge List */}
      <div className="divide-y divide-white/10">
        {filteredChallenges.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            No {activeTab} challenges found
          </div>
        ) : (
          filteredChallenges.map(renderChallenge)
        )}
      </div>
    </div>
  );
};

export default ChallengeList;