import { useCallback } from 'react';
import { useWallet } from './useWallet';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function usePaystack() {
  const { currentUser } = useAuth();
  const { wallet, fetchWallet } = useWallet();
  const toast = useToast();

  const initializePayment = useCallback(
    async (amount: number) => {
      if (!currentUser?.id) {
        toast.showError('Please sign in to make a deposit');
        return;
      }

      if (!wallet?.id) {
        toast.showError('Unable to access wallet. Please try again.');
        return;
      }

      if (amount < 100) {
        toast.showError('Minimum deposit amount is ₦100');
        return;
      }

      if (!window.PaystackPop) {
        toast.showError('Payment gateway unavailable. Please try again later.');
        return;
      }

      try {
        // Generate unique transaction reference
        const reference = `DEP_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;

        // Initialize Paystack popup
        const handler = new window.PaystackPop();
        handler.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: currentUser.email || '',
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          ref: reference,
          metadata: {
            wallet_id: wallet.id,
            user_id: currentUser.id,
            custom_fields: [
              {
                display_name: 'Transaction Type',
                variable_name: 'transaction_type',
                value: 'wallet_funding',
              },
            ],
          },
          callback: async (response: { reference: string }) => {
            try {
              // Verify transaction
              const { error: verifyError } = await supabase.rpc(
                'verify_paystack_transaction',
                {
                  p_reference: response.reference,
                  p_amount: amount,
                  p_status: 'completed',
                }
              );

              if (verifyError) {
                console.error('Error verifying payment:', verifyError);
                throw verifyError;
              }

              // Refresh wallet balance
              await fetchWallet();
              toast.showSuccess('Payment successful!');
            } catch (error) {
              console.error('Error verifying payment:', error);
              toast.showError(
                error instanceof Error
                  ? error.message
                  : 'Failed to verify payment'
              );
            }
          },
          onClose: () => {
            toast.showInfo('Payment cancelled');
          },
        });
      } catch (error) {
        console.error('Error initializing payment:', error);
        toast.showError(
          error instanceof Error
            ? error.message
            : 'Failed to initialize payment'
        );
      }
    },
    [currentUser, wallet, fetchWallet, toast]
  );

  return {
    initializePayment,
  };
}
