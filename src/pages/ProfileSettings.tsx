import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { privyDIDtoUUID } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingOverlay from '../components/LoadingOverlay';

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        avatar_url: currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`
      });
      setInitialized(true);
    }
  }, [currentUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setImageLoading(true);
      const userId = privyDIDtoUUID(currentUser.id);
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      await refreshUser();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const userId = privyDIDtoUUID(currentUser.id);

      // Validate username format
      if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          bio: formData.bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Username is already taken');
        }
        throw error;
      }

      await refreshUser();
      navigate(-1);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !currentUser) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b2e]">
      {loading && <LoadingOverlay message="Saving changes..." />}

      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            disabled={loading}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={formData.avatar_url}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover bg-[#242538]"
            />
            <label className="absolute bottom-0 right-0 p-2 bg-[#CCFF00] rounded-full cursor-pointer hover:bg-[#b3ff00] transition-colors">
              {imageLoading ? (
                <LoadingSpinner size="sm" color="#000000" />
              ) : (
                <Camera className="w-4 h-4 text-black" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={imageLoading || loading}
              />
            </label>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] disabled:opacity-50"
            placeholder="Your name"
            disabled={loading}
            maxLength={50}
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] disabled:opacity-50"
            placeholder="@username"
            disabled={loading}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
          />
          <p className="mt-1 text-sm text-gray-400">
            Only letters, numbers, and underscores allowed
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] disabled:opacity-50"
            placeholder="Tell us about yourself"
            rows={4}
            disabled={loading}
            maxLength={160}
          />
          <p className="mt-1 text-sm text-gray-400">
            {formData.bio.length}/160 characters
          </p>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Email
          </label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#242538]">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-white/60">
              {typeof currentUser.email === 'string' 
                ? currentUser.email 
                : currentUser.email?.address || 'No email set'}
            </span>
          </div>
        </div>

        {/* Password Change Link */}
        <button
          type="button"
          disabled={loading}
          className="flex items-center gap-2 text-[#CCFF00] hover:underline disabled:opacity-50"
        >
          <Lock className="w-5 h-5" />
          <span>Change Password</span>
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="#000000" />
              <span>Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;