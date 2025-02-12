import React from 'react';
import { Wallet as WalletIcon } from 'lucide-react';
import WalletCard from '../components/WalletCard';
import TransactionHistory from '../components/TransactionHistory';
import MobileFooterNav from '../components/MobileFooterNav';

const Wallet: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDEDED] pb-[72px]">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-2">
          <WalletIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">Wallet</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <WalletCard />
        <TransactionHistory />
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Wallet;