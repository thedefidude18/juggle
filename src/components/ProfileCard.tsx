import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp } from 'lucide-react';
import { useProfile, Profile } from '../hooks/useProfile';
import LoadingSpinner from './LoadingSpinner';
import ChallengeModal from './ChallengeModal';
import { useAuth } from '../contexts/AuthContext';

interface ProfileCardProps {
  userId: string;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const { loading, getProfile, followUser, unfollowUser } = useProfile();
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile(userId);
      setProfile(data);
    };
    loadProfile();
  }, [userId, getProfile]);

  const handleFollow = async () => {
    if (!profile) return;
    
    const success = await followUser(profile.id);
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count + 1,
        is_following: true
      } : null);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    
    const success = await unfollowUser(profile.id);
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count - 1,
        is_following: false
      } : null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#242538] rounded-2xl p-6 w-full max-w-md">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#242538] rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="text-xl font-bold text-white">{profile.name}</h3>
              <p className="text-white/60">@{profile.username}</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-white/80 mb-6">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1b2e] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <p className="text-white/60 text-sm">Events Won</p>
              <p className="text-white font-bold text-xl">28</p>
            </div>
            <div className="bg-[#1a1b2e] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <p className="text-white/60 text-sm">Followers</p>
              <p className="text-white font-bold text-xl">{profile.followers_count}</p>
            </div>
            <div className="bg-[#1a1b2e] rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <p className="text-white/60 text-sm">Following</p>
              <p className="text-white font-bold text-xl">{profile.following_count}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {currentUser?.id !== profile.id && (
              <>
                <button
                  onClick={profile.is_following ? handleUnfollow : handleFollow}
                  disabled={loading}
                  className={`py-3 rounded-xl font-medium transition-colors ${
                    profile.is_following
                      ? 'bg-[#1a1b2e] text-white hover:bg-[#2f3049]'
                      : 'bg-[#CCFF00] text-black hover:bg-[#b3ff00]'
                  } disabled:opacity-50`}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color={profile.is_following ? '#CCFF00' : '#000000'} />
                  ) : (
                    profile.is_following ? 'Unfollow' : 'Follow'
                  )}
                </button>

                <button
                  onClick={() => setShowChallenge(true)}
                  className="py-3 bg-[#7C3AED] text-white rounded-xl font-medium hover:bg-[#6D35D3] transition-colors"
                >
                  Challenge me
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showChallenge && currentUser && (
        <ChallengeModal
          challengerId={currentUser.id}
          challengedId={profile.id}
          onClose={() => setShowChallenge(false)}
        />
      )}
    </div>
  );
};

export default ProfileCard;