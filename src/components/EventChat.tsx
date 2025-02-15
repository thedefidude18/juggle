import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  ArrowLeft, 
  Users, 
  Clock, 
  Trophy,
  MoreVertical,
  Reply,
  Ban,
  BellOff,
  Flag,
  Share2,
  MessageCircle,
  UserPlus,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../contexts/ToastContext';
import ProfileCard from './ProfileCard';
import ChallengeModal from './ChallengeModal';
import LoadingSpinner from './LoadingSpinner';

interface Message {
  id: string;
  sender_id: string;
  sender: {
    name: string;
    avatar_url: string;
    status?: string;
  };
  content: string;
  created_at: string;
  reply_to?: {
    id: string;
    content: string;
    sender: {
      name: string;
    };
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

interface EventChatProps {
  event: {
    id: string;
    title: string;
    creator: {
      id: string;
      name: string;
      avatar: string;
    };
    pool: {
      amount: number;
      participants: number;
    };
    start_time: string;
    end_time: string;
  };
  onClose: () => void;
}

// Mock messages for development
const mockMessages: Message[] = [
  {
    id: '1',
    sender_id: '1',
    sender: {
      name: 'John Doe',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      status: 'online'
    },
    content: 'Manchester United is definitely winning this! 🔴',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    reactions: [
      { emoji: '👍', count: 3, users: ['2', '3', '4'] },
      { emoji: '❤️', count: 2, users: ['5', '6'] }
    ]
  },
  {
    id: '2',
    sender_id: '2',
    sender: {
      name: 'Jane Smith',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      status: 'online'
    },
    content: 'No way, City is in better form 💪',
    created_at: new Date(Date.now() - 3300000).toISOString(),
    reply_to: {
      id: '1',
      content: 'Manchester United is definitely winning this! 🔴',
      sender: { name: 'John Doe' }
    },
    reactions: [
      { emoji: '🔥', count: 4, users: ['1', '3', '4', '5'] }
    ]
  },
  {
    id: '3',
    sender_id: '3',
    sender: {
      name: 'Mike Johnson',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      status: 'away'
    },
    content: 'The odds are pretty close though 🎲',
    created_at: new Date(Date.now() - 3000000).toISOString(),
    reactions: [
      { emoji: '💯', count: 2, users: ['1', '2'] }
    ]
  }
];

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '💯', '🎉'];

const EventChat: React.FC<EventChatProps> = ({ event, onClose }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState({ yes: 0, no: 0 });
  const [replyTo, setReplyTo] = useState<Message['reply_to']>();
  const [showMenu, setShowMenu] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentUser } = useAuth();
  const { messages: chatMessages, sendMessage } = useChat();
  const { wallet } = useWallet();
  const toast = useToast();

  // Use mock messages for development
  const messages = chatMessages.length > 0 ? chatMessages : mockMessages;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(event.end_time);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Event ended');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [event.end_time]);

  const handleVote = async (vote: 'yes' | 'no') => {
    if (!currentUser || hasVoted || !wallet) return;
    
    try {
      setLoading(true);
      await sendMessage(event.id, JSON.stringify({ type: 'vote', vote }));
      setHasVoted(true);
      setVotes(prev => ({
        ...prev,
        [vote]: prev[vote] + 1
      }));
      toast.showSuccess(`Vote recorded: ${vote.toUpperCase()}`);
    } catch (error) {
      toast.showError('Failed to record vote');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    
    try {
      setLoading(true);
      const messageData = {
        content: message.trim(),
        reply_to: replyTo
      };
      await sendMessage(event.id, JSON.stringify(messageData));
      setMessage('');
      setReplyTo(undefined);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.showError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await sendMessage(event.id, JSON.stringify({
        type: 'reaction',
        messageId,
        emoji
      }));
      setShowReactionPicker(null);
    } catch (error) {
      toast.showError('Failed to add reaction');
    }
  };

  const handleMuteUser = (userId: string) => {
    setMutedUsers(prev => [...prev, userId]);
    toast.showSuccess('User muted successfully');
    setShowMenu(false);
  };

  const handleBlockUser = (userId: string) => {
    setBlockedUsers(prev => [...prev, userId]);
    toast.showSuccess('User blocked successfully');
    setShowMenu(false);
  };

  const handleReport = (userId: string) => {
    toast.showSuccess('Report submitted successfully');
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1b2e]">
      {/* Telegram-style Header */}
      <div className="bg-[#242538] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <img
              src={event.creator.avatar}
              alt={event.creator.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="text-white font-medium">{event.title}</h2>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span>{event.pool.participants} participants</span>
                <span>•</span>
                <span>{timeLeft}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#CCFF00] text-black px-3 py-1 rounded-full text-sm font-medium">
              ₦{event.pool.amount.toLocaleString()}
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Header Menu */}
        {showMenu && (
          <div className="absolute top-16 right-4 bg-[#242538] rounded-xl shadow-lg py-2 min-w-[200px]">
            <button
              onClick={() => {/* Handle search */}}
              className="w-full px-4 py-2 flex items-center gap-3 text-white hover:bg-white/10"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Search Messages</span>
            </button>
            <button
              onClick={() => {/* Handle add members */}}
              className="w-full px-4 py-2 flex items-center gap-3 text-white hover:bg-white/10"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Members</span>
            </button>
            <button
              onClick={() => {/* Handle share */}}
              className="w-full px-4 py-2 flex items-center gap-3 text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Event</span>
            </button>
            <div className="border-t border-white/10 my-2" />
            <button
              onClick={() => handleReport(event.creator.id)}
              className="w-full px-4 py-2 flex items-center gap-3 text-red-500 hover:bg-white/10"
            >
              <Flag className="w-4 h-4" />
              <span>Report</span>
            </button>
          </div>
        )}

        {/* Event Actions */}
        <div className="flex items-center justify-between mt-4">
          {!hasVoted && (
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('no')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                <span>NO</span>
                <span className="bg-red-500/20 px-2 py-0.5 rounded-full">
                  {votes.no}
                </span>
              </button>
              <button
                onClick={() => handleVote('yes')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg font-medium hover:bg-[#CCFF00]/30 transition-colors disabled:opacity-50"
              >
                <span>YES</span>
                <span className="bg-[#CCFF00]/20 px-2 py-0.5 rounded-full">
                  {votes.yes}
                </span>
              </button>
            </div>
          )}
          {hasVoted && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-[#CCFF00]">Vote recorded!</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (blockedUsers.includes(msg.sender_id)) return null;
          
          return (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender_id !== currentUser?.id && (
                <img
                  src={msg.sender.avatar_url}
                  alt={msg.sender.name}
                  className="w-8 h-8 rounded-full mr-2 cursor-pointer"
                  onClick={() => setSelectedUserId(msg.sender_id)}
                />
              )}
              <div className="relative group">
                <div
                  className={`max-w-[70%] rounded-2xl p-3 ${
                    msg.sender_id === currentUser?.id
                      ? 'bg-[#CCFF00] text-black'
                      : 'bg-[#242538] text-white'
                  }`}
                >
                  {msg.sender_id !== currentUser?.id && (
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{msg.sender.name}</p>
                      {msg.sender.status && (
                        <span className={`text-xs ${
                          msg.sender.status === 'online' ? 'text-green-500' :
                          msg.sender.status === 'away' ? 'text-yellow-500' :
                          'text-gray-500'
                        }`}>
                          {msg.sender.status}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reply Preview */}
                  {msg.reply_to && (
                    <div className={`mb-2 p-2 rounded-lg text-sm ${
                      msg.sender_id === currentUser?.id
                        ? 'bg-black/10'
                        : 'bg-white/10'
                    }`}>
                      <p className="font-medium">{msg.reply_to.sender.name}</p>
                      <p className="line-clamp-1">{msg.reply_to.content}</p>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  
                  {/* Message Footer */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                    
                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1">
                        {msg.reactions.map(reaction => (
                          <button
                            key={reaction.emoji}
                            onClick={() => handleReaction(msg.id, reaction.emoji)}
                            className={`px-1.5 py-0.5 rounded-full text-xs ${
                              reaction.users.includes(currentUser?.id || '')
                                ? 'bg-[#CCFF00]/20 text-[#CCFF00]'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="absolute top-2 right-full hidden group-hover:flex items-center gap-1 mr-2">
                    <button
                      onClick={() => setReplyTo({
                        id: msg.id,
                        content: msg.content,
                        sender: { name: msg.sender.name }
                      })}
                      className="p-1.5 bg-[#242538] text-white rounded-full hover:bg-[#2f3049]"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowReactionPicker(msg.id)}
                      className="p-1.5 bg-[#242538] text-white rounded-full hover:bg-[#2f3049]"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    {msg.sender_id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => setShowChallengeModal(true)}
                          className="p-1.5 bg-[#242538] text-white rounded-full hover:bg-[#2f3049]"
                        >
                          <Gamepad2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMuteUser(msg.sender_id)}
                          className="p-1.5 bg-[#242538] text-white rounded-full hover:bg-[#2f3049]"
                        >
                          <BellOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBlockUser(msg.sender_id)}
                          className="p-1.5 bg-[#242538] text-white rounded-full hover:bg-[#2f3049]"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reaction Picker */}
                  {showReactionPicker === msg.id && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#242538] rounded-lg p-2 flex gap-1">
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-[#2f3049] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-white/60" />
            <div>
              <p className="text-white/60 text-sm">Reply to {replyTo.sender.name}</p>
              <p className="text-white text-sm line-clamp-1">{replyTo.content}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyTo(undefined)}
            className="p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-[#242538]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5 text-white/60" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message"
            className="flex-1 bg-[#1a1b2e] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="p-2 hover:bg-[#CCFF00]/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-5 h-5 text-[#CCFF00]" />
            )}
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 bg-[#242538] rounded-lg p-2 grid grid-cols-8 gap-2">
            {['😊', '😂', '❤️', '👍', '🔥', '🎉', '🎮', '🎲', '🏆', '💪', '👏', '🙌', '💯', '⚽️', '🎯', '🎪'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedUserId && (
        <ProfileCard
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {showChallengeModal && selectedUserId && currentUser && (
        <ChallengeModal
          challengerId={currentUser.id}
          challengedId={selectedUserId}
          onClose={() => {
            setShowChallengeModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default EventChat;