import React, { useState } from 'react';
import { Trophy, History, Edit2, Users, TrendingUp, Clock, Share2, Gamepad2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileFooterNav from '../components/MobileFooterNav';
import { useEvent } from '../hooks/useEvent';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ShareResultModal from '../components/ShareResultModal';

interface EventHistoryItem {
  id: string;
  type: 'challenge' | 'group_event';
  title: string;
  outcome: 'won' | 'lost';
  amount: number;
  earnings?: number;
  date: string;
  opponent?: {
    name: string;
    avatar_url: string;
  };
  group?: {
    name: string;
    avatar_url: string;
    total_participants: number;
  };
}

interface CreatedEvent {
  id: string;
  title: string;
  category: string;
  banner_url: string;
  status: 'active' | 'completed' | 'cancelled';
  wager_amount: number;
  total_participants: number;
  max_participants: number;
  created_at: string;
}

interface CreatedChallenge {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  wager_amount: number;
  opponent: {
    name: string;
    avatar_url: string;
    wins: number;
    total_matches: number;
  };
  created_at: string;
  expires_at: string;
}

const mockEventHistory: EventHistoryItem[] = [
  {
    id: '1',
    type: 'challenge',
    title: 'FIFA 24 Match',
    outcome: 'won',
    amount: 5000,
    earnings: 9500,
    date: new Date().toISOString(),
    opponent: {
      name: 'John Doe',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
    }
  },
  {
    id: '2',
    type: 'group_event',
    title: 'Premier League Predictions',
    outcome: 'lost',
    amount: 2000,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    group: {
      name: 'Premier League Bets',
      avatar_url: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=800&auto=format&fit=crop',
      total_participants: 50
    }
  },
  {
    id: '3',
    type: 'challenge',
    title: 'Call of Duty: Warzone',
    outcome: 'won',
    amount: 10000,
    earnings: 19000,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    opponent: {
      name: 'Jane Smith',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'
    }
  }
];

const mockCreatedEvents: CreatedEvent[] = [
  {
    id: '1',
    title: 'Premier League Finals',
    category: 'Sports',
    banner_url: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=800&auto=format&fit=crop',
    status: 'active',
    wager_amount: 5000,
    total_participants: 45,
    max_participants: 100,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Afrobeats Awards Night',
    category: 'Music',
    banner_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
    status: 'completed',
    wager_amount: 2000,
    total_participants: 75,
    max_participants: 100,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'NBA Finals Predictions',
    category: 'Sports',
    banner_url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&auto=format&fit=crop',
    status: 'active',
    wager_amount: 10000,
    total_participants: 25,
    max_participants: 50,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockCreatedChallenges: CreatedChallenge[] = [
  {
    id: '1',
    title: 'FIFA 24 Tournament',
    category: 'Gaming',
    status: 'active',
    wager_amount: 5000,
    opponent: {
      name: 'Mike Johnson',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      wins: 28,
      total_matches: 45
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
  },
  {
    id: '2',
    title: 'Call of Duty Match',
    category: 'Gaming',
    status: 'completed',
    wager_amount: 10000,
    opponent: {
      name: 'Sarah Wilson',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      wins: 32,
      total_matches: 50
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Street Fighter 6',
    category: 'Gaming',
    status: 'pending',
    wager_amount: 3000,
    opponent: {
      name: 'Alex Brown',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      wins: 15,
      total_matches: 25
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
  }
];

const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'history' | 'created'>('history');
  const [selectedEvent, setSelectedEvent] = useState<EventHistoryItem | null>(null);
  const { loading } = useEvent();
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleShare = async (event: EventHistoryItem) => {
    try {
      const shareText = `${event.type === 'challenge' ? '🎮' : '👥'} ${
        event.outcome === 'won' ? '🏆 Won' : '💔 Lost'
      } ${event.title}\n` +
      `${event.type === 'challenge' ? `vs ${event.opponent?.name}` : `in ${event.group?.name}`}\n` +
      `Wager: ₦${event.amount.toLocaleString()}\n` +
      `${event.earnings ? `Earnings: ₦${event.earnings.toLocaleString()}` : ''}\n` +
      `#Bantah #Gaming`;

      if (navigator.share) {
        await navigator.share({
          text: shareText,
          title: 'My Bantah Result',
          url: window.location.origin
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.showSuccess('Result copied to clipboard!');
      }
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error sharing:', error);
      toast.showError('Failed to share result');
    }
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/events/edit/${eventId}`);
  };

  const renderEventHistory = () => (
    <div className="space-y-4">
      {mockEventHistory.map((event) => (
        <div key={event.id} className="bg-[#242538] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {event.type === 'challenge' ? (
                <>
                  <img
                    src={event.opponent?.avatar_url}
                    alt={event.opponent?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{event.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#7C3AED]/20 text-[#7C3AED]">
                        Challenge
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">vs {event.opponent?.name}</p>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={event.group?.avatar_url}
                    alt={event.group?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{event.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#CCFF00]/20 text-[#CCFF00]">
                        Group Event
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      {event.group?.name} • {event.group?.total_participants} participants
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              event.outcome === 'won' 
                ? 'bg-[#CCFF00]/20 text-[#CCFF00]' 
                : 'bg-red-500/20 text-red-500'
            }`}>
              {event.outcome === 'won' ? 'Won' : 'Lost'}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-white/60">
              <span>Wager: </span>
              <span className="text-white font-medium">₦{event.amount.toLocaleString()}</span>
            </div>
            {event.earnings && (
              <div className="text-[#CCFF00]">
                +₦{event.earnings.toLocaleString()}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-white/40">
                <Clock className="w-4 h-4" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => setSelectedEvent(event)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4 text-[#CCFF00]" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCreatedEvents = () => (
    <div className="space-y-6">
      {/* Challenges Section */}
      <div className="space-y-4">
        <h3 className="text-white font-medium px-1">Created Challenges</h3>
        {mockCreatedChallenges.map((challenge) => (
          <div key={challenge.id} className="bg-[#242538] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-[#CCFF00]" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{challenge.title}</h3>
                  <p className="text-white/60 text-sm">{challenge.category}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                challenge.status === 'active' 
                  ? 'bg-[#CCFF00]/20 text-[#CCFF00]'
                  : challenge.status === 'completed'
                  ? 'bg-blue-500/20 text-blue-500'
                  : challenge.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={challenge.opponent.avatar_url}
                alt={challenge.opponent.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-white">{challenge.opponent.name}</p>
                <p className="text-white/60 text-sm">
                  {challenge.opponent.wins}/{challenge.opponent.total_matches} Wins
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">
                <span>Wager Amount: </span>
                <span className="text-[#CCFF00] font-medium">₦{challenge.wager_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4">
                {challenge.status === 'active' && (
                  <div className="flex items-center gap-1 text-[#CCFF00]">
                    <Zap className="w-4 h-4" />
                    <span>Live</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-white/40">
                  <Clock className="w-4 h-4" />
                  <span>
                    {challenge.status === 'completed' 
                      ? new Date(challenge.created_at).toLocaleDateString()
                      : `Expires in ${Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / 60000)}m`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Events Section */}
      <div className="space-y-4">
        <h3 className="text-white font-medium px-1">Created Events</h3>
        {mockCreatedEvents.map((event) => (
          <div key={event.id} className="bg-[#242538] rounded-xl overflow-hidden">
            <div className="relative h-32">
              <img
                src={event.banner_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">{event.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'active' 
                      ? 'bg-[#CCFF00]/20 text-[#CCFF00]'
                      : event.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white/60">
                  <span>Wager Amount: </span>
                  <span className="text-white font-medium">₦{event.wager_amount.toLocaleString()}</span>
                </div>
                <div className="text-white/60">
                  <span>Category: </span>
                  <span className="text-white">{event.category}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-4 h-4" />
                  <span>{event.total_participants}/{event.max_participants} Participants</span>
                </div>
                {event.status !== 'completed' && (
                  <button
                    onClick={() => handleEditEvent(event.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          <h1 className="text-xl font-bold">My Events</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="p-4">
        <div className="bg-[#242538] rounded-xl mb-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors rounded-l-xl ${
                activeTab === 'history'
                  ? 'bg-[#CCFF00] text-black'
                  : 'text-white hover:bg-white/5'
              }`}
            >
              <History className="w-5 h-5" />
              <span>Events History</span>
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors rounded-r-xl ${
                activeTab === 'created'
                  ? 'bg-[#CCFF00] text-black'
                  : 'text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Created Events</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
          </div>
        ) : (
          <>
            {activeTab === 'history' ? renderEventHistory() : renderCreatedEvents()}
          </>
        )}
      </div>

      {selectedEvent && (
        <ShareResultModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onShare={() => handleShare(selectedEvent)}
        />
      )}

      <MobileFooterNav />
    </div>
  );
};

export default MyEvents;