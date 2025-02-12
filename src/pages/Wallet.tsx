import React from 'react';
import { Wallet as WalletIcon } from 'lucide-react';
import WalletCard from '../components/WalletCard';
import TransactionHistory from '../components/TransactionHistory';
import MobileFooterNav from '../components/MobileFooterNav';

const Wallet: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDEDED] pb-[72px]">
      {/* Header */}
      <header className="bg-[#EDEDED] text-black p-4 sticky top-0 z-10 safe-top flex justify-center items-center relative">
  <button
    onClick={() => window.history.back()}
    className="absolute left-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30"
  >
    {/* Use an appropriate back arrow icon here */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  </button>
  <div className="flex items-center gap-2 pl-12">
    <h1 className="text-md font-medium text-center flex-grow">Wallet</h1>
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