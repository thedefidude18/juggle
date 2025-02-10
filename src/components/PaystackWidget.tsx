import React from 'react';
import { usePaystack } from '../hooks/usePaystack';
import { useFlutterwavePayment } from '../hooks/useFlutterwave';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface PaystackWidgetProps {
  amount: number;
  type?: 'fiat' | 'coins';
  onSuccess?: () => void;
  onClose?: () => void;
}

const PaystackWidget: React.FC<PaystackWidgetProps> = ({ 
  amount, 
  type = 'fiat',
  onSuccess, 
  onClose 
}) => {
  const { initializePayment: initializePaystack } = usePaystack();
  const { initializePayment: initializeFlutterwave } = useFlutterwavePayment();
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);

  const handlePaystackPayment = async () => {
    if (!amount || amount < 100) {
      toast.showError(`Minimum ${type === 'fiat' ? 'deposit' : 'purchase'} amount is ₦100`);
      return;
    }

    try {
      setLoading(true);
      await initializePaystack(amount, type);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing Paystack payment:', error);
      toast.showError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterwavePayment = async () => {
    if (!amount || amount < 100) {
      toast.showError(`Minimum ${type === 'fiat' ? 'deposit' : 'purchase'} amount is ₦100`);
      return;
    }

    try {
      setLoading(true);
      await initializeFlutterwave(amount, type);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing Flutterwave payment:', error);
      toast.showError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePaystackPayment}
        disabled={loading}
        className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color="#000000" />
            <span>Processing...</span>
          </>
        ) : (
          'Pay with Paystack'
        )}
      </button>

      <button
        onClick={handleFlutterwavePayment}
        disabled={loading}
        className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#FB4E20] text-white hover:bg-[#e64519] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color="#FFFFFF" />
            <span>Processing...</span>
          </>
        ) : (
          'Pay with Flutterwave'
        )}
      </button>
    </div>
  );
};

export default PaystackWidget;