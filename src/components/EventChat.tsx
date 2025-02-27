import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MoreVertical, 
  Users, 
  Wallet, 
  Clock, 
  Search, 
  Settings, 
  Megaphone,
  MessageSquareX,
  Trash2,
  Send, 
  Smile, 
  Trophy 
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';


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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);



  
// Function to search members
  const handleSearchMembers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .textSearch('users.username', query);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      toast.showError('Failed to search members');
    }
  };


    
// Function to add member
  const handleAddMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          joined_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.showSuccess('Member added successfully');
      await fetchParticipants(); // Refresh participants list
    } catch (error) {
      toast.showError('Failed to add member');
    }
  };

  // Function to fetch participants
  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          ),
          joined_at,
          is_banned
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      toast.showError('Failed to fetch participants');
    }
  };


// Function to manage member (ban/unban)
  const handleManageMember = async (userId: string, action: 'ban' | 'unban') => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ is_banned: action === 'ban' })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;
      toast.showSuccess(`User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`);
      await fetchParticipants();
      await fetchBannedUsers();
    } catch (error) {
      toast.showError(`Failed to ${action} user`);
    }
  };
  
  // Function to fetch banned users
  const fetchBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .eq('is_banned', true);

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      toast.showError('Failed to fetch banned users');
    }
  };

  // Function to clear messages
  const handleClearMessages = async () => {
    try {
      const { error } = await supabase
        .from('event_messages')
        .delete()
        .eq('event_id', eventId);

      if (error) throw error;
      setMessages([]);
      toast.showSuccess('Messages cleared successfully');
      setShowAdminMenu(false);
    } catch (error) {
      toast.showError('Failed to clear messages');
    }
  };  


   // Add useEffect to fetch initial data
  useEffect(() => {
    if (eventId) {
      fetchParticipants();
      fetchBannedUsers();
    }
  }, [eventId]);

  // Update the menu click handlers
  const handleSearchClick = () => {
    setShowSearchModal(true);
    setShowAdminMenu(false);
  };

  const handleAddMemberClick = () => {
    setShowSearchModal(true);
    setShowAdminMenu(false);
  };

  const handleManageMembersClick = () => {
    setShowManageModal(true);
    setShowAdminMenu(false);
  };

  const handleBannedUsersClick = () => {
    setShowBannedModal(true);
    setShowAdminMenu(false);
  };

  // Add isAdmin check
  const isAdmin = useMemo(() => {
    if (!eventDetails || !currentUser) return false;
    return eventDetails.creator_id === currentUser.id || currentUser.is_admin;
  }, [eventDetails, currentUser]);

  // Generate random color for user (like Twitch)
  const getUserColor = (userId: string) => {
    const colors = [
      '#FF4A4A', '#FF7A45', '#FA8C16', '#FAAD14', '#52C41A',
      '#13C2C2', '#1677FF', '#722ED1', '#EB2F96'
    ];
    const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const formatTimeLeft = (endTime: string | undefined): string => {
    if (!endTime) return 'No end time';
    
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  useEffect(() => {
    const loadEventDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            creator:creator_id (
              id,
              username,
              avatar_url
            ),
            event_participants (
              id
            ),
            event_pools (
              total_amount
            )
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Event not found');
        }

        setEventDetails({
          ...data,
          participant_count: data.event_participants?.length || 0,
          pool_amount: data.event_pools?.[0]?.total_amount || 0
        });
      } catch (err) {
        console.error('Error loading event details:', err);
        toast.showError('Failed to load event details');
      }
    };

    loadEventDetails();
  }, [eventId, toast]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.admin-menu')) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePromoteEvent = () => {
    // Implement promote event functionality
    setShowAdminMenu(false);
  };

  const handleDeleteEvent = () => {
    // Implement delete event functionality
    setShowAdminMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#18181B] text-white">
      {/* Main header */}
      <div className="bg-[#1F1F23] border-b border-gray-700">
        {/* Top row with close button and title */}
        <div className="h-12 px-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            aria-label="Close chat"
          >
            ��
          </button>

          <img
            src={eventDetails?.creator?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${eventDetails?.creator?.id}`}
            alt={eventDetails?.creator?.username}
            className="w-8 h-8 rounded-full"
          />
          
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-white truncate">
              {eventDetails?.title || 'Loading...'}
            </h2>
            <p className="text-sm text-gray-400 truncate">
              Created by @{eventDetails?.creator?.username}
            </p>
          </div>

          {/* Admin Menu */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                aria-label="Open admin menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showAdminMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#2D2D33] rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={handlePromoteEvent}
                    className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-[#3D3D43] text-white"
                  >
                    <Megaphone className="w-4 h-4" />
                    Promote Event
                  </button>
                  
                  <button
                    onClick={handleClearMessages}
                    className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-[#3D3D43] text-white"
                  >
                    <MessageSquareX className="w-4 h-4" />
                    Clear Messages
                  </button>

                  <div className="my-1 border-t border-gray-700" />
                  
                  <button
                    onClick={handleDeleteEvent}
                    className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-[#3D3D43] text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom row with stats */}
        <div className="px-4 py-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{participants.length} members</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <span>Pool: ₦{eventDetails?.pool?.total_amount?.toLocaleString() || '0'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatTimeLeft(eventDetails?.end_time)}</span>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowSearchModal(true)}
                className="ml-auto p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                aria-label="Search members"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowManageModal(true)}
                className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                aria-label="Manage members"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2D2D33] rounded-lg p-4 w-96">
            <h3 className="text-lg font-semibold mb-4">Search Members</h3>
            <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearchMembers(e.target.value);
            }}
            className="w-full bg-[#1F1F23] rounded p-2 mb-4"
            placeholder="Search by username..."
          />
          <div className="max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <div key={result.users.id} className="flex items-center justify-between p-2 hover:bg-[#3D3D43]">
                <div className="flex items-center gap-2">
                  <img
                    src={result.users.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.users.id}`}
                    alt={result.users.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{result.users.username}</span>
                </div>
                <button
                  onClick={() => handleAddMember(result.users.id)}
                  className="px-2 py-1 bg-[#CCFF00] text-black rounded"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowSearchModal(false)}
            className="mt-4 w-full bg-gray-600 rounded p-2"
          >
            Close
          </button>
        </div>
      </div>
      )}

    {showManageModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#2D2D33] rounded-lg p-4 w-96">
          <h3 className="text-lg font-semibold mb-4">Manage Members</h3>
          <div className="max-h-60 overflow-y-auto">
            {participants.map((participant) => (
              <div key={participant.users.id} className="flex items-center justify-between p-2 hover:bg-[#3D3D43]">
                <div className="flex items-center gap-2">
                  <img
                    src={participant.users.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.users.id}`}
                    alt={participant.users.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{participant.users.username}</span>
                </div>
                <button
                  onClick={() => handleManageMember(participant.users.id, participant.is_banned ? 'unban' : 'ban')}
                  className={`px-2 py-1 rounded ${participant.is_banned ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {participant.is_banned ? 'Unban' : 'Ban'}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowManageModal(false)}
            className="mt-4 w-full bg-gray-600 rounded p-2"
          >
            Close
          </button>
        </div>
      </div>
    )}

    {showBannedModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#2D2D33] rounded-lg p-4 w-96">
          <h3 className="text-lg font-semibold mb-4">Banned Users</h3>
          <div className="max-h-60 overflow-y-auto">
            {bannedUsers.map((user) => (
              <div key={user.users.id} className="flex items-center justify-between p-2 hover:bg-[#3D3D43]">
                <div className="flex items-center gap-2">
                  <img
                    src={user.users.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.users.id}`}
                    alt={user.users.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user.users.username}</span>
                </div>
                <button
                  onClick={() => handleManageMember(user.users.id, 'unban')}
                  className="px-2 py-1 bg-green-500 rounded"
                >
                  Unban
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowBannedModal(false)}
            className="mt-4 w-full bg-gray-600 rounded p-2"
          >
            Close
          </button>
        </div>
      </div>
    )}

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
              {message.senderName?.charAt(0) || 'U'}
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
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  </div>
  );
};

export default EventChat;

