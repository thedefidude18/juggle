import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Users, Clock, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEventJoinRequest } from '../hooks/useEventJoinRequest';
import { Event } from '../types/event';
import JoinRequestModal from './JoinRequestModal';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop';

interface EventCardProps {
  event: Event;
  onJoin: (prediction: boolean) => void;
  onChatClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onJoin, onChatClick }) => {
  const { currentUser } = useAuth();
  const { requestToJoin } = useEventJoinRequest();
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();
  
  // Add isActive calculation
  const isActive = React.useMemo(() => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    return now >= startTime && now <= endTime;
  }, [event.start_time, event.end_time]);

  const totalParticipants = event.participants?.length || 0;

  const getTimeLeft = () => {
    const now = new Date();
    const end = new Date(event.end_time);
    const diff = end.getTime() - now.getTime();

    if (diff < 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  };

  const handleJoinClick = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (event.is_private) {
      setShowJoinModal(true);
    } else {
      onJoin(true);
    }
  };

  const handleJoinRequest = async (message: string) => {
    const success = await requestToJoin(event.id, message);
    if (success) {
      setJoinRequestStatus('pending');
    }
  };

  return (
    <>
      <div className="bg-[#242538] rounded-xl overflow-hidden shadow-lg text-white">
        {/* Banner Section */}
        <div className="relative">
          <img
            src={event.banner_url || DEFAULT_BANNER}
            alt={event.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_BANNER;
            }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Live Badge */}
          {isActive && (
            <span className="absolute top-2 left-2 bg-[#CCFF00] text-black px-3 py-1 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-black rounded-full mr-2 animate-pulse"></span>
              LIVE
            </span>
          )}

          {/* Category Badge */}
          <span className="absolute top-2 right-2 bg-[#7C3AED]/80 text-white px-3 py-1 rounded-full text-sm">
            {event.category}
          </span>

          {/* Title and Pool Amount */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg line-clamp-2">{event.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-[#7C3AED] text-white px-3 py-1 rounded-full text-sm">
                Pool: ₦{event.pool?.total_amount?.toLocaleString() || '0'}
              </span>
              <span className="bg-[#1a1b2e] text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Users size={14} />
                {totalParticipants}/{event.max_participants || 'unlimited'}
              </span>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-4">
          {/* Creator Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.id}`}
                alt={event.creator.username}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <span className="text-white/60">@{event.creator.username}</span>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Trophy size={12} />
                  <span>{event.creator?.matches_won || 0} wins</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-sm">
              <Clock size={14} />
              <span>{getTimeLeft()}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleJoinClick}
            disabled={joinRequestStatus === 'pending'}
            className={`w-full mt-4 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2
              ${joinRequestStatus === 'pending'
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-[#7C3AED] hover:bg-[#5B21B6]'
              }`}
          >
            {event.is_private && <Lock size={16} />}
            {joinRequestStatus === 'pending'
              ? 'Request Pending'
              : event.is_private
              ? 'Request to Join'
              : 'Join Event'}
          </button>
        </div>
      </div>

      <JoinRequestModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinRequest}
        eventTitle={event.title}
        wagerAmount={event.pool?.total_amount || 0}
        creator={{
          id: event.creator.id,
          username: event.creator.username || '',
          name: event.creator.username || '', // Fallback to username if name is not available
          avatar_url: event.creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.id}`,
          rank: 'Rookie', // Default rank or you can make it optional
          stats: {
            wins: 0, // Default values since stats are not available
            total_matches: 0,
            win_rate: 0
          }
        }}
        eventDetails={{
          category: event.category,
          startTime: event.start_time,
          maxParticipants: event.max_participants || 0,
          currentParticipants: event.participants?.length || 0
        }}
      />
    </>
  );
};

export default EventCard;
