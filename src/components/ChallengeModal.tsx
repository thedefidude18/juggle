import React, { useState } from 'react';
import { X, Clock, Trophy } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface ChallengeModalProps {
  challengerId: string;
  challengedId: string;
  onClose: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ 
  challengerId,
  challengedId,
  onClose 
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { wallet } = useWallet();
  const { createChat, sendMessage } = useChat();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 100) {
      toast.showError('Minimum bet amount is ₦100');
      return;
    }

    if (parseFloat(amount) > (wallet?.balance || 0)) {
      toast.showError('Insufficient balance');
      return;
    }

    try {
      setLoading(true);

      // Create or get existing chat
      const chat = await createChat([challengedId], false);
      if (!chat) throw new Error('Failed to create chat');

      // Send challenge message
      await sendMessage(chat.id, JSON.stringify({
        type: 'challenge',
        amount: parseFloat(amount),
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      }));

      toast.showSuccess('Challenge sent successfully');
      onClose();
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.showError('Failed to send challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#242538] rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Send Challenge</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Bet Amount (₦)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
              placeholder="Enter amount"
              min="100"
              required
              disabled={loading}
            />
            <p className="mt-1 text-sm text-white/60">
              Available balance: ₦ {wallet?.balance.toLocaleString() || '0'}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1b2e] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <p className="text-white/60 text-sm">Expires in</p>
              <p className="text-white font-bold">30 minutes</p>
            </div>
            <div className="bg-[#1a1b2e] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <p className="text-white/60 text-sm">Winner Takes</p>
              <p className="text-white font-bold">
                ₦ {amount ? (parseFloat(amount) * 2).toLocaleString() : '0'}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="#000000" />
                <span>Sending Challenge...</span>
              </>
            ) : (
              'Send Challenge'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChallengeModal;