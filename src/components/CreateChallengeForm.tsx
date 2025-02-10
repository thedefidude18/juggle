import React, { useState, useEffect } from 'react';
import { Search, Trophy, Clock, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import LoadingOverlay from './LoadingOverlay';
import SocialChallengeSuccess from './SocialChallengeSuccess';

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  stats?: {
    wins: number;
    total_matches: number;
  };
}

interface CreateChallengeFormProps {
  onClose: () => void;
}

interface SocialPlatform {
  id: 'twitter' | 'telegram';
  label: string;
  placeholder: string;
  prefix: string;
}

interface SocialChallengeState {
  platform: string;
  username: string;
  link: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    label: 'Twitter',
    placeholder: 'Enter Twitter username',
    prefix: '@'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    placeholder: 'Enter Telegram username',
    prefix: '@'
  }
];

const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({ onClose }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [wagerAmount, setWagerAmount] = useState('');
  const [expiresIn, setExpiresIn] = useState('30'); // minutes
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [socialUsernames, setSocialUsernames] = useState<Record<string, string>>({
    twitter: '',
    telegram: ''
  });
  const [challengeLinks, setChallengeLinks] = useState<Record<string, string>>({
    twitter: '',
    telegram: ''
  });
  const [successChallenge, setSuccessChallenge] = useState<SocialChallengeState | null>(null);
  const { currentUser } = useAuth();
  const { createChat, sendMessage } = useChat();
  const toast = useToast();

  useEffect(() => {
    // Update challenge links when usernames change
    const baseUrl = window.location.origin;
    const updatedLinks: Record<string, string> = {};

    Object.entries(socialUsernames).forEach(([platform, username]) => {
      if (username) {
        const challengeData = {
          title,
          amount: parseInt(wagerAmount) || 0,
          challenger: currentUser?.username,
          platform
        };
        
        const queryParams = new URLSearchParams({
          ref: username,
          data: btoa(JSON.stringify(challengeData))
        });

        updatedLinks[platform] = `${baseUrl}/challenge?${queryParams.toString()}`;
      } else {
        updatedLinks[platform] = '';
      }
    });

    setChallengeLinks(updatedLinks);
  }, [socialUsernames, title, wagerAmount, currentUser?.username]);

  useEffect(() => {
    // Fetch users based on search query
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser?.id)
          .ilike('username', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.showError('Failed to fetch users');
      }
    };

    if (searchQuery) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, currentUser?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseInt(wagerAmount);
    if (!amount || amount < 100) {
      toast.showError('Minimum bet amount is ₦100');
      return;
    }

    if (!acceptedTerms) {
      toast.showError('Please accept the terms and conditions');
      return;
    }

    try {
      setLoading(true);

      // Create chat if there's a selected user
      if (selectedUser) {
        const chat = await createChat([selectedUser.id], false);
        if (!chat) throw new Error('Failed to create chat');

        // Send challenge message
        await sendMessage(chat.id, JSON.stringify({
          type: 'challenge',
          amount: amount,
          status: 'pending',
          expires_at: new Date(Date.now() + parseInt(expiresIn) * 60 * 1000).toISOString()
        }));

        toast.showSuccess('Challenge sent successfully');
        onClose();
      }

      // Send social platform challenges
      for (const [platform, username] of Object.entries(socialUsernames)) {
        if (username) {
          // Create notification or record for social platform challenge
          await supabase.from('social_challenges').insert({
            platform,
            username,
            title,
            amount,
            challenger_id: currentUser?.id,
            expires_at: new Date(Date.now() + parseInt(expiresIn) * 60 * 1000).toISOString()
          });

          // Show success modal for the first social platform challenge
          if (!selectedUser) {
            setSuccessChallenge({
              platform,
              username,
              link: challengeLinks[platform]
            });
            return; // Exit after showing first success
          }
        }
      }
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.showError('Failed to send challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (platform: string) => {
    const link = challengeLinks[platform];
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        toast.showSuccess(`${platform} challenge link copied!`);
      } catch (error) {
        toast.showError('Failed to copy link');
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {loading && (
          <LoadingOverlay message="Sending challenge..." />
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Challenge Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            placeholder="e.g., FIFA 24 Match"
            required
            disabled={loading}
          />
        </div>

        {/* User Search */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Search Bantah Users
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#242538] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
              placeholder="Search by username"
              disabled={loading}
            />
          </div>

          {/* Search Results */}
          {users.length > 0 && (
            <div className="mt-2 bg-[#242538] rounded-xl overflow-hidden">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchQuery('');
                    setUsers([]);
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-medium">{user.name}</h3>
                    <p className="text-white/60 text-sm">@{user.username}</p>
                  </div>
                  {user.stats && (
                    <div className="text-right">
                      <p className="text-[#CCFF00] font-medium">
                        {user.stats.wins}/{user.stats.total_matches}
                      </p>
                      <p className="text-white/60 text-sm">Wins</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected User */}
        {selectedUser && (
          <div className="bg-[#242538] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-white font-medium">{selectedUser.name}</h3>
                <p className="text-white/60 text-sm">@{selectedUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>
        )}

        {/* Social Platform Usernames */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-400">
            Challenge on Social Platforms
          </label>
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                    {platform.prefix}
                  </span>
                  <input
                    type="text"
                    value={socialUsernames[platform.id]}
                    onChange={(e) => setSocialUsernames(prev => ({
                      ...prev,
                      [platform.id]: e.target.value
                    }))}
                    className="w-full bg-[#242538] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                    placeholder={platform.placeholder}
                    disabled={loading}
                  />
                </div>
                {challengeLinks[platform.id] && (
                  <button
                    type="button"
                    onClick={() => handleCopyLink(platform.id)}
                    className="px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
                  >
                    Copy Link
                  </button>
                )}
              </div>
              {challengeLinks[platform.id] && (
                <div className="bg-[#1a1b2e] rounded-lg p-3">
                  <p className="text-white/60 text-sm truncate">
                    {challengeLinks[platform.id]}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Wager Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Wager Amount (₦)
          </label>
          <input
            type="number"
            value={wagerAmount}
            onChange={(e) => setWagerAmount(e.target.value)}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            placeholder="Enter amount"
            min="100"
            required
            disabled={loading}
          />
        </div>

        {/* Expires In */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Expires In (minutes)
          </label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            disabled={loading}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        {/* Terms and Submit */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#CCFF00] focus:ring-[#CCFF00]"
              disabled={loading}
            />
            <span className="text-sm text-white/60">
              I accept the terms and conditions
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !acceptedTerms || (!selectedUser && !Object.values(socialUsernames).some(Boolean))}
            className="w-full py-4 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="#000000" />
                <span>Sending Challenge...</span>
              </>
            ) : (
              'Send Challenge'
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {successChallenge && (
        <SocialChallengeSuccess
          platform={successChallenge.platform}
          username={successChallenge.username}
          amount={parseInt(wagerAmount)}
          title={title}
          link={successChallenge.link}
          onClose={() => {
            setSuccessChallenge(null);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default CreateChallengeForm;