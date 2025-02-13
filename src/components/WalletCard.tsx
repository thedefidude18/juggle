import React, { useState } from 'react';
import { Wallet, ArrowDownRight, Coins, Plus } from 'lucide-react';
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
      <div className="bg-[#1e1e2e] rounded-xl p-6 flex items-center justify-center shadow-lg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e2e] rounded-xl p-6 shadow-lg text-white">
      {/* Balance */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-gray-400">Total Balance</p>
          <h2 className="text-2xl font-bold">
            ₦ {wallet?.balance.toLocaleString() || '0'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#333] p-2 rounded-full">
            <Wallet className="w-4 h-4 text-[#CCFF00]" />
          </div>
          <div className="flex items-center bg-[#333] p-2 rounded-full">
            <Coins className="w-4 h-4 text-[#CCFF00]" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => {
            setDepositType('fiat');
            setShowDeposit(true);
          }}
          className="flex flex-col items-center p-4 bg-[#333] rounded-lg hover:bg-[#444] transition-colors"
        >
          <ArrowDownRight className="w-6 h-6 text-[#CCFF00] mb-2" />
          <p className="text-sm font-medium">Deposit</p>
        </button>
        <button
          onClick={() => {
            setDepositType('coins');
            setShowDeposit(true);
          }}
          className="flex flex-col items-center p-4 bg-[#333] rounded-lg hover:bg-[#444] transition-colors"
        >
          <Coins className="w-6 h-6 text-[#CCFF00] mb-2" />
          <p className="text-sm font-medium">Buy Coins</p>
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
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-[#333] text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                placeholder="Enter amount"
                min="100"
              />
            </div>
            {depositType === 'coins' && depositAmount && (
              <p className="mt-2 text-sm text-gray-400">
                ≈ ₦{calculateFiat(parseInt(depositAmount)).toLocaleString()}
              </p>
            )}
            {depositType === 'fiat' && depositAmount && (
              <p className="mt-2 text-sm text-gray-400">
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
