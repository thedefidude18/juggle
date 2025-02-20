import React, { useState } from 'react';
import { X, Upload, Trophy, Clock, Users } from 'lucide-react';
import { useEvent } from '../hooks/useEvent';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import LoadingOverlay from './LoadingOverlay';
import { supabase } from '../lib/supabase';

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

  const { createEvent } = useEvent();
  const toast = useToast();

  const categories = [
    {
      id: 'sports',
      label: 'Sports',
      icon: '⚽️',
    },
    {
      id: 'music',
      label: 'Music',
      icon: '🎵',
    },
    {
      id: 'gaming',
      label: 'Gaming',
      icon: '🎮',
    },
    {
      id: 'politics',
      label: 'Politics',
      icon: '🗳️',
    },
    {
      id: 'entertainment',
      label: 'Entertainment',
      icon: '🎬',
    },
    {
      id: 'other',
      label: 'Other',
      icon: '📌',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/quicktime'];
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
    createPreview(file);
  };

  const createPreview = (file: File) => {
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
              setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
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

      toast.showSuccess('Event created successfully');
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

  const testEventData = {
    title: "Test Event",
    description: "This is a test event",
    category: "Sports",
    startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour from now
    endTime: new Date(Date.now() + 7200000).toISOString().slice(0, 16),   // 2 hours from now
    wagerAmount: "100",
    maxParticipants: "2",
    rules: "1. Test rule\n2. Another test rule",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {loading && <LoadingOverlay />}

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.label}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-lg"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={minEndTime}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Wager Amount (₦)</label>
            <input
              type="number"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(e.target.value)}
              min="100"
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Participants</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="2"
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rules</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="w-full p-2 border rounded-lg"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Banner Image</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,video/quicktime"
            className="w-full p-2 border rounded-lg"
          />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-2 max-h-40 rounded" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-4 h-4"
            required
          />
          <label className="text-sm">I accept the terms and conditions</label>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="flex-1 py-4 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
      </div>
    </form>
  );
};

export default CreateEventForm;
