import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';
import { useWallet, Transaction } from '../hooks/useWallet';

const TransactionHistory: React.FC = () => {
  const { transactions, loading } = useWallet();

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-5 h-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'transfer':
        return <Send className="w-5 h-5 text-[#CCFF00]" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#242538] rounded-xl">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Transaction History</h2>
      </div>

      <div className="divide-y divide-white/10">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            No transactions yet
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium capitalize">
                    {transaction.type}
                  </h3>
                  <span className={`font-medium ${
                    transaction.type === 'deposit' ? 'text-green-500' : 
                    transaction.type === 'withdrawal' ? 'text-red-500' : 
                    'text-[#CCFF00]'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'} ₦{transaction.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white/60 text-sm">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                  </span>
                  <span className={`text-sm ${
                    transaction.status === 'completed' ? 'text-green-500' :
                    transaction.status === 'failed' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;