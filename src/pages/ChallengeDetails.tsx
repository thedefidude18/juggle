import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Zap } from 'lucide-react';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';

const ChallengeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');

  // Mock data - replace with real data from your API
  const challenge = {
    id,
    challenger: {
      name: 'John Doe',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      wins: 28,
      total_matches: 45
    },
    challenged: {
      name: 'Jane Smith',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      wins: 32,
      total_matches: 50
    },
    amount: 5000,
    type: 'FIFA 24 Match',
    rules: [
      'Best of 3 matches',
      'Default team settings',
      'No custom formations',
      'Winner must provide screenshot proof',
      'Match must be completed within time limit'
    ],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
    status: 'active' as const,
    accepted: false
  };

  useEffect(() => {
    if (challenge.status === 'scheduled' || challenge.status === 'active') {
      const timer = setInterval(() => {
        const diff = new Date(challenge.expires_at).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('Expired');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(
            hours > 0 
              ? `${hours}h ${minutes}m ${seconds}s`
              : `${minutes}m ${seconds}s`
          );
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [challenge.expires_at, challenge.status]);

  const getStatusDisplay = () => {
    switch (challenge.status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 text-[#CCFF00]">
            <Zap className="w-4 h-4" />
            <span>Active Challenge</span>
          </div>
        );
      case 'ended':
        return (
          <div className="flex items-center gap-2 text-[#CCFF00]">
            <Trophy className="w-4 h-4" />
            <span>Challenge Completed</span>
          </div>
        );
      case 'scheduled':
        return challenge.accepted ? (
          <div className="flex items-center gap-2 text-yellow-500">
            <Clock className="w-4 h-4" />
            <span>Starting in {timeLeft}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-500">
            <Clock className="w-4 h-4" />
            <span>Waiting for Acceptance</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      <Header 
        title="Challenge Details" 
        icon={<Zap className="w-6 h-6" />}
        showMenu={false}
      />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Challenge Status */}
        <div className="bg-[#242538] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#CCFF00]" />
              <h2 className="text-lg font-semibold text-white">{challenge.type}</h2>
            </div>
            {getStatusDisplay()}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-center">
              <img
                src={challenge.challenger.avatar_url}
                alt={challenge.challenger.name}
                className="w-20 h-20 rounded-full mx-auto mb-2"
              />
              <h3 className="text-white font-medium">{challenge.challenger.name}</h3>
              <p className="text-white/60 text-sm">
                {challenge.challenger.wins}/{challenge.challenger.total_matches} Wins
              </p>
            </div>

            <div className="text-center">
              <div className="text-[#CCFF00] font-bold text-xl mb-2">VS</div>
              <div className="bg-[#CCFF00]/20 text-[#CCFF00] px-4 py-2 rounded-lg font-bold">
                ₦ {challenge.amount.toLocaleString()}
              </div>
            </div>

            <div className="text-center">
              <img
                src={challenge.challenged.avatar_url}
                alt={challenge.challenged.name}
                className="w-20 h-20 rounded-full mx-auto mb-2"
              />
              <h3 className="text-white font-medium">{challenge.challenged.name}</h3>
              <p className="text-white/60 text-sm">
                {challenge.challenged.wins}/{challenge.challenged.total_matches} Wins
              </p>
            </div>
          </div>
        </div>

        {/* Challenge Rules */}
        <div className="bg-[#242538] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Rules</h3>
          <ul className="space-y-2">
            {challenge.rules.map((rule, index) => (
              <li key={index} className="flex items-center gap-2 text-white/80">
                <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Match Info */}
        <div className="bg-[#242538] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Match Information</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Created</span>
              <span className="text-white">
                {new Date(challenge.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">
                {challenge.status === 'scheduled' ? 'Starts' : 'Expires'}
              </span>
              <span className="text-white">
                {new Date(challenge.expires_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Time Remaining</span>
              <span className="text-[#CCFF00] font-medium">
                {timeLeft}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Status</span>
              <span className="text-[#CCFF00] font-medium capitalize">
                {challenge.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default ChallengeDetails;