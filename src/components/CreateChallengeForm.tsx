import React, { useState, useEffect } from 'react';
import { Search, Trophy, Clock, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import LoadingOverlay from './LoadingOverlay';
import SocialChallengeSuccess from './SocialChallengeSuccess';

interface SocialPlatform {
  id: 'twitter' | 'telegram';
  label: string;
  placeholder: string;
  prefix: string;
}

interface ChallengeData {
  title: string;
  wagerAmount: number;
  gameType: 'FIFA' | 'NBA2K' | 'OTHER';
  platform: 'PS5' | 'XBOX' | 'PC';
  expiresIn: string; // in minutes
  rules: string;
  evidence: 'SCREENSHOT' | 'VIDEO' | 'BOTH';
  category: string; // Add this if needed
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  stats?: {
    wins: number;
    total_matches: number;
  };
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

interface CreateChallengeFormProps {
  onClose: () => void;
}

interface SuccessChallenge {
  platform: string;
  username: string;
  link: string;
}

const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData>({
    title: '',
    description: '',
    wagerAmount: 100,
    gameType: 'FIFA',
    platform: 'PS5',
    expiresIn: '30',
    rules: '',
    evidence: 'SCREENSHOT',
    category: 'Sports'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [socialUsernames, setSocialUsernames] = useState<Record<string, string>>({
    twitter: '',
    telegram: ''
  });
  const [challengeLinks, setChallengeLinks] = useState<Record<string, string>>({
    twitter: '',
    telegram: ''
  });
  const [successChallenge, setSuccessChallenge] = useState<SuccessChallenge | null>(null);

  const { currentUser } = useAuth();
  const { wallet } = useWallet();
  const toast = useToast();

  useEffect(() => {
    // Update challenge links when usernames change
    const baseUrl = window.location.origin;
    const updatedLinks: Record<string, string> = {};

    Object.entries(socialUsernames).forEach(([platform, username]) => {
      if (username) {
        const linkData = {
          title: challengeData.title,
          amount: challengeData.wagerAmount,
          challenger: currentUser?.username,
          platform
        };
        
        const queryParams = new URLSearchParams({
          ref: typeof username === 'string' ? username : '',
          data: btoa(JSON.stringify(linkData))
        });

        updatedLinks[platform] = `${baseUrl}/challenge?${queryParams.toString()}`;
      } else {
        updatedLinks[platform] = '';
      }
    });

    setChallengeLinks(updatedLinks);
  }, [socialUsernames, challengeData.title, challengeData.wagerAmount, currentUser?.username]);

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
    
    try {
      setLoading(true);

      if (!wallet || wallet.balance < challengeData.wagerAmount) {
        toast.showError('Insufficient balance');
        return;
      }

      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: currentUser?.id,
          amount: challengeData.wagerAmount,
          title: challengeData.title,
          game_type: challengeData.gameType,
          platform: challengeData.platform,
          expires_at: new Date(Date.now() + parseInt(challengeData.expiresIn) * 60 * 1000),
          rules: challengeData.rules,
          required_evidence: challengeData.evidence
        });

      if (error) throw error;

      // Handle social challenge success
      const [[, socialUsername], [platform]] = Object.entries(socialUsernames)
        .filter(([, username]) => username)
        .slice(0, 1)
        .map(([platform, username]) => [platform, username]);
      
      if (socialUsername && platform) {
        setSuccessChallenge({
          platform,
          username: socialUsername,
          link: challengeLinks[platform]
        });
      } else {
        toast.showSuccess('Challenge created successfully');
        onClose();
      }

    } catch (error) {
      toast.showError('Failed to create challenge');
      console.error('Error creating challenge:', error);
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
        console.error('Failed to copy link:', error);
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
            value={challengeData.title}
            onChange={(e) => setChallengeData({...challengeData, title: e.target.value})}
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
                src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
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
                aria-label="Remove selected user"
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Wager Amount (₦)</label>
        <input
          type="number"
          id="wagerAmount"
          aria-label="Wager amount in Naira"
          placeholder="Enter wager amount"
          min="100"
          value={challengeData.wagerAmount}
          onChange={(e) => setChallengeData({...challengeData, wagerAmount: parseInt(e.target.value)})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          required
        />
        <p className="mt-1 text-sm text-gray-500">Minimum bet: ₦100</p>
      </div>

        {/* Expires In */}
        <div>
          <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-400 mb-2">
            Expires In (minutes)
          </label>
          <select
            id="expiresIn"
            name="expiresIn"
            aria-label="Challenge expiration time"
            value={challengeData.expiresIn}
            onChange={(e) => setChallengeData({...challengeData, expiresIn: e.target.value})}
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
          amount={challengeData.wagerAmount}
          title={challengeData.title}
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

