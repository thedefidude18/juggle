import React from 'react';
import { ArrowLeft, Share2, Gift, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReferral } from '../hooks/useReferral';
import MobileFooterNav from '../components/MobileFooterNav';
import LoadingSpinner from '../components/LoadingSpinner';

const Referral: React.FC = () => {
  const navigate = useNavigate();
  const { referralCode, stats, generateReferralCode } = useReferral();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode) {
      try {
        await navigator.share({
          title: 'Join me on Bantah',
          text: `Use my referral code ${referralCode} to join Bantah and start betting on anything!`,
          url: window.location.origin
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDED] pb-[72px]">
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
            <h1 className="text-xl font-bold">Refer & Earn</h1>
          </div>
          <button 
            onClick={handleShare}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#242538] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <p className="text-white/60 text-sm">Total Referrals</p>
            <p className="text-white font-bold text-xl">{stats.totalReferrals}</p>
          </div>
          <div className="bg-[#242538] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
              <Gift className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <p className="text-white/60 text-sm">Total Rewards</p>
            <p className="text-[#CCFF00] font-bold text-xl">₦ {stats.totalRewards.toLocaleString()}</p>
          </div>
          <div className="bg-[#242538] rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <p className="text-white/60 text-sm">Pending</p>
            <p className="text-white font-bold text-xl">{stats.pendingReferrals}</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-white font-bold mb-4">Your Referral Code</h2>
          <div className="bg-[#1a1b2e] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="font-syne text-2xl text-[#CCFF00] tracking-wider">
                {referralCode || '--------'}
              </p>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors"
          >
            Share Code
          </button>
        </div>

        {/* How it Works */}
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-white font-bold mb-4">How it Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#CCFF00]">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Share Your Code</p>
                <p className="text-white/60 text-sm">Share your unique referral code with friends</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#CCFF00]">2</span>
              </div>
              <div>
                <p className="text-white font-medium">Friends Join</p>
                <p className="text-white/60 text-sm">They sign up using your referral code</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#CCFF00]">3</span>
              </div>
              <div>
                <p className="text-white font-medium">Earn Rewards</p>
                <p className="text-white/60 text-sm">Get ₦500 for every 10 friends who join</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-white font-bold mb-4">Terms & Conditions</h2>
          <ul className="list-disc list-inside text-white/60 text-sm space-y-2">
            <li>Referral rewards are paid out when your referred friends join and participate in events</li>
            <li>Each friend must use your referral code during sign up</li>
            <li>Rewards are credited to your wallet automatically</li>
            <li>Bantah reserves the right to modify or terminate the referral program at any time</li>
          </ul>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Referral;