import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmailSignIn: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('user-not-found')) {
          try {
            await signUp(email, password);
          } catch (signUpErr) {
            setError('Failed to create account');
          }
        } else {
          setError('Failed to sign in');
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#242538] rounded-2xl w-full max-w-md p-6">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-white mb-6">
            Sign in with email
          </h2>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors mb-3 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#1a1b2e] text-white hover:bg-[#2f3049] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-3 rounded-xl font-medium text-[#CCFF00] hover:bg-[#1a1b2e] transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
