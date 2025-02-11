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
  <div className="flex overflow-x-auto scrollbar-hide gap-4 mb-6">
    {/* Public Event Button */}
    <button
      onClick={() => setEventType('public')}
      className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
        eventType === 'public'
          ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.3)]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
      style={{ minWidth: '200px' }} // Reduced minimum width
    >
      <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
        <Globe className={`w-5 h-5 ${
          eventType === 'public' ? 'text-[#CCFF00]' : 'text-white'
        }`} />
      </div>
      <div className="text-left">
        <h3 className="font-medium text-white text-sm">Public Event</h3> {/* Smaller font size */}
        <p className="text-xs text-white/60">Anyone can join</p> {/* Smaller font size */}
      </div>
    </button>

    {/* Private Event Button */}
    <button
      onClick={() => setEventType('private')}
      className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
        eventType === 'private'
          ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.3)]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
      style={{ minWidth: '200px' }} // Reduced minimum width
    >
      <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
        <Lock className={`w-5 h-5 ${
          eventType === 'private' ? 'text-[#CCFF00]' : 'text-white'
        }`} />
      </div>
      <div className="text-left">
        <h3 className="font-medium text-white text-sm">Private Event</h3> {/* Smaller font size */}
        <p className="text-xs text-white/60">Invite-only</p> {/* Smaller font size */}
      </div>
    </button>

    {/* Challenge Button */}
    <button
      onClick={() => setEventType('challenge')}
      className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
        eventType === 'challenge'
          ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.3)]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      }`}
      style={{ minWidth: '200px' }} // Reduced minimum width
    >
      <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
        <Gamepad2 className={`w-5 h-5 ${
          eventType === 'challenge' ? 'text-[#CCFF00]' : 'text-white'
        }`} />
      </div>
      <div className="text-left">
        <h3 className="font-medium text-white text-sm">Challenge</h3> {/* Smaller font size */}
        <p className="text-xs text-white/60">Challenge users</p> {/* Smaller font size */}
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