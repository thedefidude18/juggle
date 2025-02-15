import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const SignIn: React.FC = () => {
  const { login } = usePrivy();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Privy Sign-In
  const handlePrivySignIn = async () => {
    try {
      await login();
      toast.showSuccess('Signed in with Privy!');
    } catch (error) {
      console.error('Privy Sign-in error:', error);
      toast.showError('Failed to sign in. Please try again.');
    }
  };

  // Handle Supabase Email Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.showError(error.message);
      console.error('Supabase Sign-in error:', error);
    } else {
      toast.showSuccess('Signed in successfully!');
      navigate('/dashboard'); // Redirect to a page after login
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDED] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Bantah with love!</h1>
        <p className="text-gray-400 text-lg mb-6">
          Challenge and win your friends in any event.
        </p>

        {/* Supabase Email Login Form */}
        <form onSubmit={handleEmailSignIn} className="w-full max-w-xs mx-auto space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg bg-white text-black border border-gray-300 focus:ring-2 focus:ring-[#CCFF00]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-white text-black border border-gray-300 focus:ring-2 focus:ring-[#CCFF00]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-lg font-semibold bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors transform hover:scale-105"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </button>
        </form>

        <div className="my-4 text-gray-500 text-sm">OR</div>

        {/* Privy Login Button */}
        <button
          onClick={handlePrivySignIn}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors transform hover:scale-105"
        >
          Sign In with Privy
        </button>

        <div className="mt-6 text-gray-400 text-sm">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#CCFF00] hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-[#CCFF00] hover:underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
};

export default SignIn;
