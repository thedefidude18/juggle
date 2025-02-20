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
    <div className="min-h-screen bg-[#EDEDED]">
      {/* Header */}
      <div className="bg-[#EDEDED] text-black flex justify-center items-center relative p-4">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-xl font-medium">Create an Event</h1>
      </div>

      {/* Event Type Selection */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex overflow-x-auto gap-4 mb-6 pb-2">
          {/* Public Event Button */}
          <button
            onClick={() => setEventType('public')}
            className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
              eventType === 'public'
                ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ minWidth: '200px' }}
          >
            <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Globe className={`w-5 h-5 ${
                eventType === 'public' ? 'text-[#CCFF00]' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-black text-sm">Public Event</h3>
              <p className="text-xs text-gray-600">Anyone can join</p>
            </div>
          </button>

          {/* Private Event Button */}
          <button
            onClick={() => setEventType('private')}
            className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
              eventType === 'private'
                ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ minWidth: '200px' }}
          >
            <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Lock className={`w-5 h-5 ${
                eventType === 'private' ? 'text-[#CCFF00]' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-black text-sm">Private Event</h3>
              <p className="text-xs text-gray-600">Invite-only</p>
            </div>
          </button>

          {/* Challenge Button */}
          <button
            onClick={() => setEventType('challenge')}
            className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
              eventType === 'challenge'
                ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ minWidth: '200px' }}
          >
            <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
              <Gamepad2 className={`w-5 h-5 ${
                eventType === 'challenge' ? 'text-[#CCFF00]' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-black text-sm">Challenge</h3>
              <p className="text-xs text-gray-600">Challenge users</p>
            </div>
          </button>
        </div>

        {/* Form */}
        <div className="mt-6">
          {eventType === 'challenge' ? (
            <CreateChallengeForm onClose={() => navigate(-1)} />
          ) : (
            <CreateEventForm onClose={() => navigate(-1)} eventType={eventType} />
          )}
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Create;