import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';

const SignIn: React.FC = () => {
  const { login } = usePrivy();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignIn = async () => {
    try {
      await login();
      // Privy handles the redirect automatically
    } catch (error) {
      console.error('Sign in error:', error);
      toast.showError('Failed to initialize sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f1a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Bantah with love!</h1>
          <p className="text-gray-400 text-lg">
            Challenge and win your friends in any event.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors transform hover:scale-105"
        >
          Sign In
        </button>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            By continuing, you agree to our{' '}
            <a href="#" className="text-[#CCFF00] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[#CCFF00] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;