import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users, Trophy, Clock, TrendingUp, TrendingDown, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from './UserAvatar';

interface EventChatProps {
  event: {
    id: string;
    title: string;
    is_private: boolean;
    creator_id: string;
    creator: {
      id: string;
      name: string;
      username: string;
      avatar_url: string;
    };
    participants?: any[];
    end_time: string;
    pool?: {
      total_amount: number;
    };
    yesVotes?: number;
    noVotes?: number;
  };
}

const EventChat: React.FC<EventChatProps> = ({ event }) => {
  const { currentUser } = useAuth();
  const { messages, sendMessage } = useChat(event.id);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        if (!event.is_private) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('event_participants')
          .select('*')
          .eq('event_id', event.id)
          .eq('user_id', currentUser.id)
          .single();

        if (error) throw error;
        
        setHasAccess(!!data || event.creator_id === currentUser.id);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [event.id, event.is_private, event.creator_id, currentUser]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1b2e]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4 text-center bg-[#1a1b2e] text-white h-full">
        <p className="text-gray-400">
          {event.is_private 
            ? "You need to be accepted to the event to participate in the chat"
            : "Join the event to participate in the chat"}
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      setLoading(true);
      await sendMessage(event.id, message.trim());
      setMessage('');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.showError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBet = (prediction: boolean) => {
    toast.showSuccess(`Placed bet for ${prediction ? 'YES' : 'NO'}`);
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1a1b2e]">
      {/* Header */}
      <div className="bg-[#242538]">
        {/* Top Header with Back Button and Event Info */}
        <div className="px-4 py-3">
          {/* Back button and title row */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>

            {/* Creator Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img 
                src={event.creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.id}`}
                alt={event.creator.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Event Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-medium text-lg truncate">
                {event.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>@{event.creator.username}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{event.participants?.length || 0} participants</span>
                </div>
              </div>
            </div>
          </div>

          {/* Betting Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              onClick={() => handleBet(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium bg-[#CCFF00]/20 text-[#CCFF00] hover:bg-[#CCFF00]/30 transition-colors"
            >
              <TrendingUp size={16} />
              <span>YES ({event.yesVotes || 0})</span>
            </button>

            <button
              onClick={() => handleBet(false)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
            >
              <TrendingDown size={16} />
              <span>NO ({event.noVotes || 0})</span>
            </button>
          </div>
        </div>

        {/* Bottom Header with Event Status */}
        <div className="px-4 py-2 bg-[#CCFF00]/5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#CCFF00]" />
              <span className="text-white/70">
                {new Date(event.end_time) > new Date() 
                  ? `Ends ${format(new Date(event.end_time), 'MMM d, h:mm a')}`
                  : 'Event Ended'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#CCFF00]" />
              <span className="text-white/70">
                Pool: ₦{event.pool?.total_amount?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-white/60 text-center">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.sender_id === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                {!isSender && (
                  <UserAvatar
                    src={msg.sender?.avatar_url}
                    alt={msg.sender?.name}
                    size="sm"
                    className="mr-2"
                  />
                )}
                <div className={`max-w-[70%] rounded-xl p-3 ${
                  isSender 
                    ? 'bg-[#CCFF00] text-black' 
                    : 'bg-[#242538] text-white'
                }`}>
                  {!isSender && (
                    <div className="text-sm text-white/60 mb-1">
                      {msg.sender?.name}
                    </div>
                  )}
                  <p>{msg.content}</p>
                  <div className="text-xs mt-1 opacity-60">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-[#242538] border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-[#1a1b2e] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
          />
          <button 
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="p-2 bg-[#CCFF00] text-black rounded-lg hover:bg-[#b3ff00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventChat;
