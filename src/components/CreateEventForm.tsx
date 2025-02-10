import React, { useState } from 'react';
import { X, Upload, Trophy, Clock, Users } from 'lucide-react';
import { useEvent } from '../hooks/useEvent';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import LoadingOverlay from './LoadingOverlay';

interface CreateEventFormProps {
  onClose: () => void;
  eventType: 'public' | 'private';
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onClose,
  eventType,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sports');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [wagerAmount, setWagerAmount] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('2');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rules, setRules] = useState('');

  const { createEvent, categoryStats } = useEvent();
  const toast = useToast();

  const categories = [
    {
      id: 'sports',
      label: 'Sports',
      icon: '⚽️',
      events: categoryStats.find((s) => s.category === 'Sports')?.count || 0,
    },
    {
      id: 'music',
      label: 'Music',
      icon: '🎵',
      events: categoryStats.find((s) => s.category === 'Music')?.count || 0,
    },
    {
      id: 'gaming',
      label: 'Gaming',
      icon: '🎮',
      events: categoryStats.find((s) => s.category === 'Gaming')?.count || 0,
    },
    {
      id: 'politics',
      label: 'Politics',
      icon: '🗳️',
      events: categoryStats.find((s) => s.category === 'Politics')?.count || 0,
    },
    {
      id: 'entertainment',
      label: 'Entertainment',
      icon: '🎬',
      events:
        categoryStats.find((s) => s.category === 'Entertainment')?.count || 0,
    },
    {
      id: 'other',
      label: 'Other',
      icon: '📌',
      events: categoryStats.find((s) => s.category === 'Other')?.count || 0,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/quicktime',
    ];
    if (!validTypes.includes(file.type)) {
      toast.showError('Please upload a JPG, PNG, GIF, or MOV file');
      return;
    }

    // Check file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.showError('File size must be less than 2MB');
      return;
    }

    setBannerFile(file);

    // Create preview URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For video files, create a video thumbnail
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.showError('Please accept the terms and conditions');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate <= new Date()) {
      toast.showError('Start time must be in the future');
      return;
    }

    if (endDate <= startDate) {
      toast.showError('End time must be after start time');
      return;
    }

    const amount = parseInt(wagerAmount);
    if (!amount || amount < 100) {
      toast.showError('Minimum bet amount is ₦100');
      return;
    }

    try {
      setLoading(true);

      let bannerUrl = '';
      if (bannerFile) {
        const { data, error } = await supabase.storage
          .from('event-banners')
          .upload(`${Date.now()}-${bannerFile.name}`, bannerFile, {
            onUploadProgress: (progress) => {
              setUploadProgress(
                Math.round((progress.loaded / progress.total) * 100)
              );
            },
          });

        if (error) throw error;
        bannerUrl = data.path;
      }

      await createEvent({
        title,
        description,
        category,
        start_time: startDate,
        end_time: endDate,
        wager_amount: amount,
        max_participants: parseInt(maxParticipants),
        banner_url: bannerUrl,
        is_private: eventType === 'private',
        rules: rules.trim(),
      });

      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.showError('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Calculate minimum end time based on start time
  const minEndTime = startTime
    ? new Date(new Date(startTime).getTime() + 15 * 60000)
        .toISOString()
        .slice(0, 16)
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {loading && (
        <LoadingOverlay
          message={
            uploadProgress > 0
              ? `Uploading banner... ${uploadProgress}%`
              : 'Creating event...'
          }
        />
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Event Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          placeholder="Enter event title"
          required
          disabled={loading}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          placeholder="Describe your event"
          rows={4}
          required
          disabled={loading}
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Category
        </label>
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-3 min-w-max pb-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.label)}
                className={`p-4 rounded-xl flex flex-col items-center min-w-[120px] ${
                  category === cat.label
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#242538] text-white hover:bg-[#2f3049]'
                }`}
                disabled={loading}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="font-medium">{cat.label}</span>
                <span className="text-xs opacity-70">{cat.events} Events</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Start Time
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            min={new Date().toISOString().slice(0, 16)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            End Time
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            min={minEndTime}
            required
            disabled={loading || !startTime}
          />
        </div>
      </div>

      {/* Participants and Fee */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Number of Participants
          </label>
          <input
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            min="2"
            required
            disabled={loading}
          />
        </div>
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
            required
            min="100"
            disabled={loading}
          />
        </div>
      </div>

      {/* Event Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Event Rules
        </label>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="w-full bg-[#242538] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          placeholder="Set the rules and guidelines for your event"
          rows={4}
          disabled={loading}
        />
        <p className="mt-1 text-sm text-white/60">
          Clearly define how winners will be determined and any specific rules
          participants should follow.
        </p>
      </div>

      {/* Banner Upload */}
      <div className="border-2 border-dashed border-[#242538] rounded-xl p-4">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.mov"
          onChange={handleFileChange}
          className="hidden"
          id="banner"
          disabled={loading}
        />
        <label
          htmlFor="banner"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {previewUrl ? (
            <div className="relative">
              {bannerFile?.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-black rounded-lg flex items-center justify-center">
                  <video
                    src={URL.createObjectURL(bannerFile!)}
                    className="max-h-full"
                    controls
                  />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setBannerFile(null);
                  setPreviewUrl('');
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-[#CCFF00]" />
              <span className="text-white/60">
                Upload banner (JPG, PNG, GIF, MOV - max 2MB)
              </span>
            </div>
          )}
        </label>
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
          disabled={loading || !acceptedTerms}
          className="w-full py-4 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="#000000" />
              <span>Creating Event...</span>
            </>
          ) : (
            'Create Event'
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateEventForm;
