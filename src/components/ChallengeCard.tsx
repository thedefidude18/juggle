import React, { useState } from 'react';
import { Share2, Clock, Trophy } from 'lucide-react';
import ShareChallengeModal from './ShareChallengeModal';

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    type: string;
    amount: number;
    expires_at: string;
    status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
    challenger: {
      name: string;
      avatar_url: string;
      wins: number;
      total_matches: number;
    };
    challenged?: {
      name: string;
      avatar_url: string;
      wins: number;
      total_matches: number;
    };
  };
  onAccept?: () => void;
  onDecline?: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onAccept,
  onDecline,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time left
  React.useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const end = new Date(challenge.expires_at);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    const timer = setInterval(updateTimeLeft, 1000);
    updateTimeLeft();

    return () => clearInterval(timer);
  }, [challenge.expires_at]);

  return (
    <>
      <div className="bg-[#242538] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-[#CCFF00]" />
            </div>
            <div>
              <h3 className="text-white font-medium">{challenge.title}</h3>
              <p className="text-white/60 text-sm">{challenge.type}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Share challenge"
            onClick={() => setShowShareModal(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-[#CCFF00]" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img
              src={challenge.challenger.avatar_url}
              alt={challenge.challenger.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-white">{challenge.challenger.name}</p>
              <p className="text-white/60 text-sm">
                {challenge.challenger.wins}/{challenge.challenger.total_matches}{' '}
                Wins
              </p>
            </div>
          </div>
          <div className="text-[#CCFF00] font-bold">
            ₦ {challenge.amount.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Clock className="w-4 h-4" />
            <span>{timeLeft}</span>
          </div>
          {challenge.status === 'pending' && onAccept && onDecline && (
            <div className="flex gap-2">
              <button
                onClick={onDecline}
                className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                className="px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg text-sm font-medium hover:bg-[#CCFF00]/30 transition-colors"
              >
                Accept
              </button>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareChallengeModal
          challenge={challenge}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default ChallengeCard;
