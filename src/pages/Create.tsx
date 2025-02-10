import React, { useState } from 'react';
import { X, Users, Trophy, Globe, Lock, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateEventForm from '../components/CreateEventForm';
import CreateChallengeForm from '../components/CreateChallengeForm';
import MobileFooterNav from '../components/MobileFooterNav';

type EventType = 'public' | 'private' | 'challenge';

const Create: React.FC = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventType>('public');

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      {/* Header */}
      <div className="bg-[#7C3AED] text-white">
        <div className="flex items-center justify-between p-4 safe-top">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">New Event</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Event Type Selection */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setEventType('public')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              eventType === 'public'
                ? 'border-[#CCFF00] bg-[#CCFF00]/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Globe className={`w-6 h-6 ${eventType === 'public' ? 'text-[#CCFF00]' : 'text-white'}`} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Public Event</h3>
              <p className="text-sm text-white/60">Anyone can join and participate</p>
            </div>
          </button>

          <button
            onClick={() => setEventType('private')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              eventType === 'private'
                ? 'border-[#CCFF00] bg-[#CCFF00]/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Lock className={`w-6 h-6 ${eventType === 'private' ? 'text-[#CCFF00]' : 'text-white'}`} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Private Event</h3>
              <p className="text-sm text-white/60">Invite-only participation</p>
            </div>
          </button>

          <button
            onClick={() => setEventType('challenge')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              eventType === 'challenge'
                ? 'border-[#CCFF00] bg-[#CCFF00]/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Gamepad2 className={`w-6 h-6 ${eventType === 'challenge' ? 'text-[#CCFF00]' : 'text-white'}`} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-white">Challenge</h3>
              <p className="text-sm text-white/60">Challenge specific users</p>
            </div>
          </button>
        </div>

        {/* Form */}
        {eventType === 'challenge' ? (
          <CreateChallengeForm onClose={() => navigate(-1)} />
        ) : (
          <CreateEventForm onClose={() => navigate(-1)} eventType={eventType} />
        )}
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Create;