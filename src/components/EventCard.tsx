import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../hooks/useEvent';

interface EventCardProps {
  event: Event;
  onJoin: (prediction: boolean) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onJoin }) => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const isActive = new Date(event.start_time) <= new Date() && new Date(event.end_time) >= new Date();
  const yesVotes = event.participants?.filter(p => p.prediction).length || 0;
  const noVotes = event.participants?.filter(p => !p.prediction).length || 0;
  const totalParticipants = event.participants?.length || 0;

  const getTimeLeft = () => {
    const now = new Date();
    const end = new Date(event.end_time);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Event ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleJoin = (prediction: boolean) => {
    if (!currentUser) {
      login();
      return;
    }
    onJoin(prediction);
  };

  return (
    <div className="bg-[#242538] rounded-xl overflow-hidden shadow-lg text-white">
      {/* Banner Section */}
      <div className="relative">
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop'}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        
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
                <span>{event.creator.wins || 0} wins</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Clock size={14} />
            <span>{getTimeLeft()}</span>
          </div>
        </div>

        {/* Voting Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleJoin(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30 transition-colors"
          >
            <TrendingUp size={16} />
            <span>YES ({yesVotes})</span>
          </button>

          <button
            onClick={() => handleJoin(false)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
          >
            <TrendingUp size={16} className="rotate-180" />
            <span>NO ({noVotes})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => navigate(`/event/${event.id}`)}
          className="w-full mt-4 px-4 py-2 bg-[#7C3AED] text-white rounded-xl font-medium hover:bg-[#5B21B6] transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default EventCard;
