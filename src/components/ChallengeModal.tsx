import React, { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface ChallengeModalProps {
  challengerId: string;
  challengedId: string;
  challengedName: string;
  challengedUsername: string;
  challengedAvatar: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challengerId,
  challengedId,
  challengedName,
  challengedUsername,
  challengedAvatar,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [challengeData, setChallengeData] = useState({
    title: '',
    amount: 100,
    gameType: 'FIFA' as 'FIFA' | 'NBA2K' | 'OTHER',
    platform: 'PS5' as 'PS5' | 'XBOX' | 'PC',
    expiresIn: '30',
    rules: '',
    evidence: 'SCREENSHOT' as 'SCREENSHOT' | 'VIDEO' | 'BOTH'
  });
  
  const { wallet } = useWallet();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!wallet || wallet.balance < challengeData.amount) {
        toast.showError('Insufficient balance');
        return;
      }

      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: challengerId,
          challenged_id: challengedId,
          amount: challengeData.amount,
          title: challengeData.title,
          game_type: challengeData.gameType,
          platform: challengeData.platform,
          expires_at: new Date(Date.now() + parseInt(challengeData.expiresIn) * 60 * 1000),
          rules: challengeData.rules,
          required_evidence: challengeData.evidence,
          status: 'pending'
        });

      if (error) throw error;

      toast.showSuccess('Challenge sent successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.showError('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#242538] rounded-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="mb-6">
          <h2 className="text-white font-bold text-xl mb-4">Challenge Player</h2>
          
          {/* Challenged Player Info */}
          <div className="flex items-center gap-4 bg-[#1a1b2e] rounded-xl p-4">
            <img
              src={challengedAvatar}
              alt={challengedName}
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <h3 className="text-white font-medium">{challengedName}</h3>
              <p className="text-white/60">@{challengedUsername}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1">Title</label>
            <input
              type="text"
              value={challengeData.title}
              onChange={(e) => setChallengeData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-[#1a1b2e] rounded-xl p-3 text-white"
              placeholder="e.g., FIFA 24 Match"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-1">Amount (₦)</label>
            <input
              type="number"
              value={challengeData.amount}
              onChange={(e) => setChallengeData(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
              className="w-full bg-[#1a1b2e] rounded-xl p-3 text-white"
              min="100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Game</label>
              <select
                value={challengeData.gameType}
                onChange={(e) => setChallengeData(prev => ({ ...prev, gameType: e.target.value as any }))}
                className="w-full bg-[#1a1b2e] rounded-xl p-3 text-white"
                required
              >
                <option value="FIFA">FIFA</option>
                <option value="NBA2K">NBA 2K</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">Platform</label>
              <select
                value={challengeData.platform}
                onChange={(e) => setChallengeData(prev => ({ ...prev, platform: e.target.value as any }))}
                className="w-full bg-[#1a1b2e] rounded-xl p-3 text-white"
                required
              >
                <option value="PS5">PS5</option>
                <option value="XBOX">Xbox</option>
                <option value="PC">PC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-1">Rules</label>
            <textarea
              value={challengeData.rules}
              onChange={(e) => setChallengeData(prev => ({ ...prev, rules: e.target.value }))}
              className="w-full bg-[#1a1b2e] rounded-xl p-3 text-white"
              rows={3}
              placeholder="Specify any rules or conditions..."
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-1">Required Evidence</label>
            <select
              value={challengeData.evidence}
              onChange={(e) => setChallengeData(prev => ({ ...prev, evidence: e.target.value as any }))}
              className="w-full bg-[#1a1b2e] rounded-xl p-3 text-white"
              required
            >
              <option value="SCREENSHOT">Screenshot</option>
              <option value="VIDEO">Video</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="#000000" />
                <span>Sending Challenge...</span>
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                <span>Send Challenge</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChallengeModal;
