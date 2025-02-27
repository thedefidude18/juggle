import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEvent } from '../hooks/useEvent';
import LoadingSpinner from './LoadingSpinner';
import { Users, Calendar, Trophy, ExternalLink, Smile, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: string;
  // Add color for username (common in livestream chats)
  userColor?: string;
}

interface EventChatProps {
  eventId: string;
  onClose: () => void;
}

const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: 'user1',
    senderName: 'John Doe',
    content: 'Hey everyone! Ready for the FIFA tournament? 🎮',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userColor: '#FF6B6B'
  },
  {
    id: '2',
    senderId: 'user2',
    senderName: 'Sarah Smith',
    content: "Count me in! What's the prize pool looking like? 🏆",
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    userColor: '#4ECDC4'
  },
  {
    id: '3',
    senderId: 'user3',
    senderName: 'Mike Johnson',
    content: 'Current pool is at ₦50,000! Still time to join guys',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    userColor: '#FFD93D'
  },
  {
    id: '4',
    senderId: 'user4',
    senderName: 'Emma Wilson',
    content: 'What teams are allowed in this tournament?',
    timestamp: new Date(Date.now() - 3300000).toISOString(),
    userColor: '#6C5CE7'
  },
  {
    id: '5',
    senderId: 'user1',
    senderName: 'John Doe',
    content: 'All teams are allowed except for All-Star teams 👍',
    timestamp: new Date(Date.now() - 3200000).toISOString(),
    userColor: '#FF6B6B'
  },
  {
    id: '6',
    senderId: 'user5',
    senderName: 'Alex Brown',
    content: "Perfect! Just registered. Can't wait! 🔥",
    timestamp: new Date(Date.now() - 3100000).toISOString(),
    userColor: '#A8E6CF'
  }
];

const EventChat: React.FC<EventChatProps> = ({ eventId, onClose }) => {
  const { socket, connected } = useSocket();
  const { currentUser } = useAuth();
  const toast = useToast();
  const { getEvent } = useEvent();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);

  // Generate random color for user (like Twitch)
  const getUserColor = (userId: string) => {
    const colors = [
      '#FF4A4A', '#FF7A45', '#FA8C16', '#FAAD14', '#52C41A',
      '#13C2C2', '#1677FF', '#722ED1', '#EB2F96'
    ];
    const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  useEffect(() => {
    const loadEventDetails = async () => {
      try {
        const event = await getEvent(eventId);
        setEventDetails(event);
      } catch (err) {
        console.error('Error loading event details:', err);
        toast.showError('Failed to load event details');
      }
    };

    loadEventDetails();
  }, [eventId, getEvent]);

  useEffect(() => {
    if (!socket || !eventId) {
      setError('Chat connection not available');
      setLoading(false);
      return;
    }

    socket.emit('join_event_chat', { eventId });

    socket.on('event_message', (message: Message) => {
      setMessages(prev => {
        // Keep only last 100 messages for performance
        const newMessages = [...prev, message];
        if (newMessages.length > 100) {
          return newMessages.slice(-100);
        }
        return newMessages;
      });
      // Auto-scroll to bottom on new message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    const loadChatHistory = async () => {
      try {
        socket.emit('get_event_messages', { eventId }, (response: { messages: Message[], error?: string }) => {
          setLoading(false);
          if (response.error) {
            setError(response.error);
            return;
          }
          setMessages(response.messages?.slice(-100) || []);
          messagesEndRef.current?.scrollIntoView();
        });
      } catch (err) {
        console.error('Error loading chat history:', err);
        setError('Failed to load chat history');
        setLoading(false);
      }
    };

    loadChatHistory();

    return () => {
      socket.off('event_message');
      socket.emit('leave_event_chat', { eventId });
    };
  }, [socket, eventId]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      senderId: 'currentUser',
      senderName: 'You',
      content: messageText,
      timestamp: new Date().toISOString(),
      userColor: '#FF6B6B'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#18181B] text-white">
      {/* Enhanced Header with Event Details */}
      <div className="border-b border-gray-700 bg-[#1F1F23]">
        {/* Main Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {eventDetails?.title || 'Event Chat'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={14} />
              <span>{eventDetails?.current_participants || 0} participants</span>
              <span className="mx-1">•</span>
              <Trophy size={14} />
              <span>₦{eventDetails?.pool?.total_amount?.toLocaleString() || 0} pool</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Event Details Bar */}
        {eventDetails && (
          <div className="px-3 py-2 bg-[#2D2D33] text-sm flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src={eventDetails.creator.avatar_url || '/default-avatar.png'}
                alt={eventDetails.creator.username}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-purple-400">@{eventDetails.creator.username}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={14} />
              <span>{formatDateTime(eventDetails.start_time)}</span>
            </div>
            <a
              href={`/events/${eventId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <ExternalLink size={14} />
              <span>View Event</span>
            </a>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#18181B]">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex items-start space-x-2 ${
              message.senderId === 'currentUser' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.senderId !== 'currentUser' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                {message.senderName.charAt(0)}
              </div>
            )}
            <div className={`max-w-[70%] ${
              message.senderId === 'currentUser' 
                ? 'bg-purple-600' 
                : 'bg-gray-700'
            } rounded-2xl px-4 py-2`}>
              <div className="flex items-center gap-2">
                {message.senderId !== 'currentUser' && (
                  <span className="font-medium text-sm" style={{ color: message.userColor }}>
                    {message.senderName}
                  </span>
                )}
              </div>
              <p className="text-sm break-words">{message.content}</p>
              <span className="text-xs text-gray-400 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-[#1F1F23] border-t border-gray-700">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-full px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type a message..."
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-600 rounded-full"
            >
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventChat;
