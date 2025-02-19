import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const SignIn: React.FC = () => {
  const { currentUser, login, signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Handle Email Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.showError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign-Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.showError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      toast.showSuccess('Account created successfully! Please sign in.');
      setIsSignIn(true);
    } catch (error) {
      console.error('Sign-up error:', error);
      toast.showError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      toast.showError('Please enter your email to reset your password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setLoading(false);

    if (error) {
      toast.showError(error.message);
    } else {
      toast.showSuccess('Password reset link sent! Check your email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDED] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-black mb-4">Bantah with love!</h1>
        <p className="text-gray-600 text-lg mb-6">
          Challenge and win your friends in any event.
        </p>

        {/* Toggle Buttons */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setIsSignIn(true)}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              isSignIn
                ? 'bg-[#CCFF00] text-black'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignIn(false)}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              !isSignIn
                ? 'bg-[#CCFF00] text-black'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={isSignIn ? handleEmailSignIn : handleSignUp} className="w-full max-w-xs mx-auto space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            disabled={loading}
          />
          {!isSignIn && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
              disabled={loading}
            />
          )}
          <button
            type="submit"
            className="w-full bg-[#CCFF00] text-black py-2 rounded font-medium hover:bg-[#b3ff00] transition-colors"
            disabled={loading}
          >
            {loading ? 'Processing...' : isSignIn ? 'Sign In' : 'Sign Up'}
          </button>
          {isSignIn && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:underline"
              disabled={loading}
            >
              Forgot Password?
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignIn;
