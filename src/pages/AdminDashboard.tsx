import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Trophy,
  ArrowLeft,
  Check,
  X,
  Wallet,
  Coins,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { loading, getStats, getReports, getPendingOutcomes, toggleSettlementMethod } = useAdmin();
  const toast = useToast();

  const [stats, setStats] = useState<any>(null);
  const [pendingOutcomes, setPendingOutcomes] = useState<any[]>([]);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isCoinsEnabled, setIsCoinsEnabled] = useState(false);

  useEffect(() => {
    const isDev = import.meta.env.MODE === 'development'; // Check if in dev mode
    
    if (!currentUser?.is_admin && !isDev) {
      navigate('/');
      return;
    }
  
    loadStats();
    loadPendingOutcomes();
  }, [currentUser]);
  

  const loadStats = async () => {
    try {
      const stats = await getStats();
      setStats(stats);
      setIsCoinsEnabled(stats.settlement_method === 'coins');
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.showError('Failed to load admin stats');
    }
  };

  const loadPendingOutcomes = async () => {
    try {
      setLoadingOutcomes(true);
      const { data: outcomes } = await supabase.rpc('get_pending_outcomes', {
        p_admin_id: currentUser?.id
      });
      setPendingOutcomes(outcomes || []);
    } catch (error) {
      console.error('Error loading outcomes:', error);
      toast.showError('Failed to load pending outcomes');
    } finally {
      setLoadingOutcomes(false);
    }
  };

  const handleToggleSettlement = async () => {
    try {
      const success = await toggleSettlementMethod(!isCoinsEnabled);
      if (success) {
        setIsCoinsEnabled(!isCoinsEnabled);
        toast.showSuccess(`Switched to ${!isCoinsEnabled ? 'Coins' : 'Fiat'} settlement`);
        loadStats();
      }
    } catch (error) {
      console.error('Error toggling settlement method:', error);
      toast.showError('Failed to toggle settlement method');
    }
  };

  const handleSetEventOutcome = async (eventId: string, winningPrediction: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_set_event_outcome', {
        p_event_id: eventId,
        p_winning_prediction: winningPrediction,
        p_admin_id: currentUser?.id
      });

      if (error) throw error;
      toast.showSuccess('Event outcome set successfully');
      loadPendingOutcomes();
      loadStats();
    } catch (error) {
      console.error('Error setting event outcome:', error);
      toast.showError('Failed to set event outcome');
    }
  };

  const handleWithdrawFees = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.showError('Please enter a valid amount');
      return;
    }

    try {
      const { error } = await supabase.rpc('withdraw_platform_fees', {
        p_amount: amount,
        p_admin_id: currentUser?.id
      });

      if (error) throw error;
      toast.showSuccess('Fees withdrawn successfully');
      loadStats();
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error withdrawing fees:', error);
      toast.showError('Failed to withdraw fees');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        {/* Settlement Method Toggle */}
        <div className="bg-[#242538] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold flex items-center gap-2">
                {isCoinsEnabled ? (
                  <Coins className="w-5 h-5 text-[#CCFF00]" />
                ) : (
                  <Wallet className="w-5 h-5 text-[#CCFF00]" />
                )}
                Settlement Method
              </h3>
              <p className="text-white/60 text-sm">
                Current method: {isCoinsEnabled ? 'Coins' : 'Fiat'}
              </p>
            </div>
            <button
              onClick={handleToggleSettlement}
              className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
            >
              {isCoinsEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  Switch to Fiat
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  Switch to Coins
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1b2e] rounded-lg p-4">
              <p className="text-white/60 mb-1">Total Fiat Volume</p>
              <p className="text-[#CCFF00] text-xl font-bold">
                ₦{stats?.total_fiat_volume?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-[#1a1b2e] rounded-lg p-4">
              <p className="text-white/60 mb-1">Total Coins Volume</p>
              <p className="text-[#CCFF00] text-xl font-bold">
                {stats?.total_coins_volume?.toLocaleString() || '0'} Coins
              </p>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#242538] rounded-xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#CCFF00]" />
              Platform Fees
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Total Fees (Fiat)</span>
                <span className="text-[#CCFF00] font-bold">
                  ₦{stats?.total_platform_fees?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Total Fees (Coins)</span>
                <span className="text-[#CCFF00] font-bold">
                  {stats?.total_platform_fees_coins?.toLocaleString() || '0'} Coins
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Fee Rate</span>
                <span className="text-white font-bold">3%</span>
              </div>
              <div className="mt-4">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full bg-[#1a1b2e] text-white px-4 py-2 rounded-lg mb-2"
                />
                <button
                  onClick={handleWithdrawFees}
                  className="w-full py-2 bg-[#CCFF00] text-black rounded-lg font-medium"
                >
                  Withdraw Fees
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Outcomes */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Pending Outcomes</h3>
          {loadingOutcomes ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : pendingOutcomes.length === 0 ? (
            <div className="bg-[#242538] rounded-xl p-6 text-center text-white/60">
              No pending outcomes to review
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOutcomes.map((outcome) => (
                <div key={outcome.id} className="bg-[#242538] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-medium">{outcome.title}</h4>
                      <p className="text-white/60 text-sm">
                        {outcome.type === 'event' ? 'Group Event' : 'P2P Challenge'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {outcome.type === 'event' ? (
                        <>
                          <button
                            onClick={() => handleSetEventOutcome(outcome.id, false)}
                            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            NO Wins
                          </button>
                          <button
                            onClick={() => handleSetEventOutcome(outcome.id, true)}
                            className="px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
                          >
                            YES Wins
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          {outcome.participants.map((p: any) => (
                            <button
                              key={p.user_id}
                              onClick={() => handleSetEventOutcome(outcome.id, p.user_id)}
                              className="px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
                            >
                              {p.username} Wins
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-white/60">
                    <p>
                      {outcome.details.settlement_type === 'coins' ? (
                        <>Amount: {outcome.details.coins_amount?.toLocaleString()} Coins</>
                      ) : (
                        <>Amount: ₦{outcome.details.wager_amount?.toLocaleString()}</>
                      )}
                    </p>
                    <p>
                      Admin Fee: {outcome.details.settlement_type === 'coins' ? (
                        <>{(outcome.details.coins_amount * 0.03)?.toLocaleString()} Coins</>
                      ) : (
                        <>₦{(outcome.details.wager_amount * 0.03)?.toLocaleString()}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;