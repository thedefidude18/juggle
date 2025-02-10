import { useCallback } from 'react';
import { useFlutterwave as useFlutterwaveSDK, closePaymentModal } from 'flutterwave-react-v3';
import { useWallet } from './useWallet';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function useFlutterwavePayment() {
  const { currentUser } = useAuth();
  const { wallet, fetchWallet } = useWallet();
  const toast = useToast();

  const initializePayment = useCallback(async (amount: number) => {
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

    try {
      // Generate unique reference
      const reference = `FLW_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const config = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: reference,
        amount: amount,
        currency: 'NGN',
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: typeof currentUser.email === 'string' 
            ? currentUser.email 
            : currentUser.email?.address || '',
          phone_number: '',
          name: currentUser.name || 'User'
        },
        customizations: {
          title: 'Bantah Wallet Funding',
          description: 'Fund your Bantah wallet',
          logo: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwMCAxMDAwIj48cGF0aCBmaWxsPSIjQ0NGRjAwIiBkPSJNNTAwIDBDNzc2LjE0MiAwIDEwMDAgMjIzLjg1OCAxMDAwIDUwMEMxMDAwIDc3Ni4xNDIgNzc2LjE0MiAxMDAwIDUwMCAxMDAwQzIyMy44NTggMTAwMCAwIDc3Ni4xNDIgMCA1MDBDMCAyMjMuODU4IDIyMy44NTggMCA1MDAgMFpNNTAwIDEwMEMyNzkuMDg2IDEwMCAxMDAgMjc5LjA4NiAxMDAgNTAwQzEwMCA3MjAuOTE0IDI3OS4wODYgOTAwIDUwMCA5MDBDNDI3LjkxNCA5MDAgOTAwIDcyMC45MTQgOTAwIDUwMEM5MDAgMjc5LjA4NiA3MjAuOTE0IDEwMCA1MDAgMTAwWiIvPjxwYXRoIGZpbGw9IiNDQ0ZGMDAiIGQ9Ik01MDAgNjAwQzU1Mi44NDMgNjAwIDYwMCA1NTIuODQzIDYwMCA1MDBDNM2MDAgNDQ3LjE1NyA1NTIuODQzIDQwMCA1MDAgNDAwQzQ0Ny4xNTcgNDAwIDQwMCA0NDcuMTU3IDQwMCA1MDBDNM0wMCA1NTIuODQzIDQ0Ny4xNTcgNjAwIDUwMCA2MDBaIi8+PC9zdmc+'
        },
        meta: {
          wallet_id: wallet.id,
          user_id: currentUser.id
        }
      };

      const handleFlutterPayment = useFlutterwaveSDK(config);

      handleFlutterPayment({
        callback: async (response) => {
          try {
            // Verify transaction
            const { error: verifyError } = await supabase
              .rpc('verify_flutterwave_transaction', {
                p_reference: response.tx_ref,
                p_amount: amount,
                p_status: 'completed'
              });

            if (verifyError) {
              console.error('Error verifying payment:', verifyError);
              throw verifyError;
            }

            // Refresh wallet balance
            await fetchWallet();
            toast.showSuccess('Payment successful!');
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast.showError('Failed to verify payment');
          } finally {
            closePaymentModal();
          }
        },
        onClose: () => {
          toast.showInfo('Payment cancelled');
          closePaymentModal();
        }
      });
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.showError(error instanceof Error ? error.message : 'Failed to initialize payment');
    }
  }, [currentUser, wallet, fetchWallet, toast]);

  return {
    initializePayment
  };
}