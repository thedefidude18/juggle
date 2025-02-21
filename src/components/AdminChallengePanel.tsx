import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { EvidenceVerificationPanel } from './EvidenceVerificationPanel';

interface AdminChallengePanelProps {
  challenge: {
    id: string;
    challenger_id: string;
    challenged_id: string;
    amount: number;
    evidence?: {
      url: string;
      type: string;
      metadata?: any;
    }[];
  };
}

export const AdminChallengePanel: React.FC<AdminChallengePanelProps> = ({ 
  challenge 
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSetWinner = async (winnerId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.rpc('admin_set_challenge_outcome', {
        p_challenge_id: challenge.id,
        p_winner_id: winnerId,
        p_admin_id: currentUser?.id
      });

      if (error) throw error;

      toast.showSuccess('Winner set successfully');
    } catch (error) {
      console.error('Error setting winner:', error);
      toast.showError('Failed to set winner');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = (verified: boolean) => {
    // Automatically set winner based on verification if needed
    // Or update challenge status
    toast.showSuccess(`Evidence ${verified ? 'approved' : 'rejected'}`);
  };

  return (
    <div className="bg-[#1a1b2e] rounded-xl p-4 space-y-4">
      <h3 className="text-white font-medium">Admin Actions</h3>
      
      {/* Evidence Verification */}
      {challenge.evidence && challenge.evidence.length > 0 && (
        <EvidenceVerificationPanel
          challenge={challenge}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {/* Winner Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => handleSetWinner(challenge.challenger_id)}
          disabled={loading}
          className="flex-1 bg-[#CCFF00] text-black font-medium py-2 rounded-lg"
        >
          Challenger Wins
        </button>
        <button
          onClick={() => handleSetWinner(challenge.challenged_id)}
          disabled={loading}
          className="flex-1 bg-[#CCFF00] text-black font-medium py-2 rounded-lg"
        >
          Challenged Wins
        </button>
      </div>
    </div>
  );
};
