import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Share2, MessageSquare, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ShareChallengeModal from '../components/ShareChallengeModal';
import EventChat from '../components/EventChat';

interface Challenge {
  id: string;
  title: string;
  amount: number;
  type: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
  challenger: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    stats?: {
      wins: number;
      total_matches: number;
    };
  };
  challenged: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
    stats?: {
      wins: number;
      total_matches: number;
    };
  };
  winner_id?: string;
}

const ChallengeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('challenges')
          .select(`
            *,
            challenger:challenger_id(*),
            challenged:challenged_id(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setChallenge(data);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        toast.showError('Failed to load challenge details');
        navigate('/games');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (!challenge) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(challenge.expires_at);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  const handleAccept = async () => {
    if (!challenge || !currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase.rpc('handle_challenge_response', {
        challenge_id: challenge.id,
        accepted: true
      });

      if (error) throw error;

      toast.showSuccess('Challenge accepted!');
      navigate('/games');
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast.showError('Failed to accept challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!challenge || !currentUser) return;

    try {
      setLoading(true);
      const { error } = await supabase.rpc('handle_challenge_response', {
        challenge_id: challenge.id,
        accepted: false
      });

      if (error) throw error;

      toast.showSuccess('Challenge declined');
      navigate('/games');
    } catch (error) {
      console.error('Error declining challenge:', error);
      toast.showError('Failed to decline challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!challenge || !currentUser) return;

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: currentUser.id,
          reported_id: challenge.challenger.id,
          type: 'challenge',
          target_id: challenge.id,
          reason: 'Inappropriate challenge'
        });

      if (error) throw error;
      toast.showSuccess('Challenge reported');
    } catch (error) {
      console.error('Error reporting challenge:', error);
      toast.showError('Failed to report challenge');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex flex-col items-center justify-center p-4">
        <Trophy className="w-12 h-12 text-[#CCFF00] mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Challenge Not Found</h1>
        <p className="text-white/60 text-center mb-6">
          This challenge may have been removed or expired
        </p>
        <button
          onClick={() => navigate('/games')}
          className="px-6 py-2 bg-[#CCFF00] text-black rounded-lg font-medium"
        >
          Back to Games
        </button>
      </div>
    );
  }

  const isChallenger = currentUser?.id === challenge.challenger.id;
  const isChallenged = currentUser?.id === challenge.challenged.id;
  const isPending = challenge.status === 'pending';
  const isActive = challenge.status === 'accepted';
  const isCompleted = challenge.status === 'completed';

  return (
    <div className="min-h-screen bg-[#1a1b2e]">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Challenge Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShare(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleReport}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Challenge Info */}
        <div className="bg-[#242538] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-xl">{challenge.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  challenge.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  challenge.status === 'accepted' ? 'bg-[#CCFF00]/20 text-[#CCFF00]' :
                  challenge.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                </span>
                {(isPending || isActive) && (
                  <div className="flex items-center gap-1 text-white/60">
                    <Clock className="w-4 h-4" />
                    <span>{timeLeft}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#CCFF00] font-bold text-xl">
                ₦{challenge.amount.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Wager Amount</p>
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={challenge.challenger.avatar_url}
                  alt={challenge.challenger.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{challenge.challenger.name}</p>
                  <p className="text-white/60 text-sm">@{challenge.challenger.username}</p>
                </div>
              </div>
              {challenge.challenger.stats && (
                <div className="bg-[#1a1b2e] rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Win Rate</span>
                    <span className="text-white font-medium">
                      {Math.round((challenge.challenger.stats.wins / challenge.challenger.stats.total_matches) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-white/60">Total Matches</span>
                    <span className="text-white font-medium">
                      {challenge.challenger.stats.total_matches}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={challenge.challenged.avatar_url}
                  alt={challenge.challenged.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{challenge.challenged.name}</p>
                  <p className="text-white/60 text-sm">@{challenge.challenged.username}</p>
                </div>
              </div>
              {challenge.challenged.stats && (
                <div className="bg-[#1a1b2e] rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Win Rate</span>
                    <span className="text-white font-medium">
                      {Math.round((challenge.challenged.stats.wins / challenge.challenged.stats.total_matches) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-white/60">Total Matches</span>
                    <span className="text-white font-medium">
                      {challenge.challenged.stats.total_matches}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {isPending && isChallenged && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDecline}
                disabled={loading}
                className="flex-1 py-3 bg-red-500/20 text-red-500 rounded-xl font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Decline'}
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" color="#000000" /> : 'Accept'}
              </button>
            </div>
          )}

          {isActive && (
            <div className="mt-6">
              <button
                onClick={() => setShowChat(true)}
                className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Open Chat</span>
              </button>
            </div>
          )}

          {isCompleted && challenge.winner_id && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg">
                <Trophy className="w-5 h-5" />
                <span>
                  {challenge.winner_id === challenge.challenger.id
                    ? challenge.challenger.name
                    : challenge.challenged.name} won!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showShare && (
        <ShareChallengeModal
          challenge={challenge}
          onClose={() => setShowShare(false)}
        />
      )}

      {showChat && (
        <EventChat
          event={{
            id: challenge.id,
            title: challenge.title,
            creator: {
              id: challenge.challenger.id,
              name: challenge.challenger.name,
              avatar: challenge.challenger.avatar_url
            },
            pool: {
              amount: challenge.amount * 2,
              participants: 2
            },
            start_time: challenge.created_at,
            end_time: challenge.expires_at
          }}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default ChallengeDetails;