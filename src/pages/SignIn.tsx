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
    <div className="min-h-screen bg-[#1a1b2e] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Bantah</h1>
          <p className="text-gray-400">Join the community and start betting on anything</p>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors"
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