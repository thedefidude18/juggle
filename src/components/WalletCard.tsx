import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Coins } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import PaystackWidget from './PaystackWidget';
import LoadingSpinner from './LoadingSpinner';

const WalletCard: React.FC = () => {
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<'fiat' | 'coins'>('fiat');
  const { wallet, loading } = useWallet();

  const handleDeposit = () => {
    setShowDeposit(false);
    setDepositAmount('');
  };

  const getExchangeRate = () => {
    // Example exchange rate: 1 Coin = ₦100
    return 100;
  };

  const calculateCoins = (amount: number) => {
    return Math.floor(amount / getExchangeRate());
  };

  const calculateFiat = (coins: number) => {
    return coins * getExchangeRate();
  };

  if (loading) {
    return (
      <div className="bg-[#242538] rounded-xl p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#242538] rounded-xl p-6">
      {/* Balance */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60">Fiat Balance</p>
            <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#CCFF00]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">
            ₦ {wallet?.balance.toLocaleString() || '0'}
          </h2>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60">Coins Balance</p>
            <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#CCFF00]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {wallet?.coins.toLocaleString() || '0'} Coins
          </h2>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => {
            setDepositType('fiat');
            setShowDeposit(true);
          }}
          className="flex items-center gap-3 p-4 bg-[#1a1b2e] rounded-xl hover:bg-[#1a1b2e]/80 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div className="text-left">
            <p className="text-white font-medium">Deposit</p>
            <p className="text-white/60 text-sm">Add funds</p>
          </div>
        </button>

        <button
          onClick={() => {
            setDepositType('coins');
            setShowDeposit(true);
          }}
          className="flex items-center gap-3 p-4 bg-[#1a1b2e] rounded-xl hover:bg-[#1a1b2e]/80 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-[#CCFF00]" />
          </div>
          <div className="text-left">
            <p className="text-white font-medium">Buy Coins</p>
            <p className="text-white/60 text-sm">Exchange</p>
          </div>
        </button>
      </div>

      {/* Deposit Form */}
      {showDeposit && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {depositType === 'fiat' ? 'Amount (₦)' : 'Amount (Coins)'}
            </label>
            <div className="relative">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-[#1a1b2e] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                placeholder="Enter amount"
                min="100"
              />
            </div>
            {depositType === 'coins' && depositAmount && (
              <p className="mt-2 text-sm text-white/60">
                ≈ ₦{calculateFiat(parseInt(depositAmount)).toLocaleString()}
              </p>
            )}
            {depositType === 'fiat' && depositAmount && (
              <p className="mt-2 text-sm text-white/60">
                ≈ {calculateCoins(parseInt(depositAmount)).toLocaleString()} Coins
              </p>
            )}
          </div>

          <PaystackWidget
            amount={parseInt(depositAmount) || 0}
            onSuccess={handleDeposit}
            onClose={() => setShowDeposit(false)}
            type={depositType}
          />
        </div>
      )}
    </div>
  );
};

export default WalletCard;