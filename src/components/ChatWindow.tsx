import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical, User, Bell, Ban, Flag } from 'lucide-react';
import { useChat, Chat as ChatType } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import ProfileCard from './ProfileCard';
import ChallengeModal from './ChallengeModal';
import UserAvatar from './UserAvatar';

interface ChatWindowProps {
  chat: ChatType;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onBack }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading, error, sendMessage } = useChat();
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage(chat.id, message.trim());
      setMessage('');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.showError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implement file upload
    toast.showInfo('File upload coming soon!');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const otherParticipants = chat.participants.filter(p => p.user_id !== currentUser?.id);

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="bg-light-card dark:bg-dark-card p-4 border-b border-light-text/10 dark:border-dark-text/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-light-text/10 dark:hover:bg-dark-text/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-light-text dark:text-dark-text" />
              </button>
            )}
            {chat.is_group ? (
              <div className="w-10 h-10 rounded-full bg-[#CCFF00]/20 flex items-center justify-center">
                <span className="text-[#CCFF00] font-bold">
                  {chat.group_name?.[0].toUpperCase()}
                </span>
              </div>
            ) : (
              <UserAvatar
                src={otherParticipants[0]?.avatar_url}
                alt={otherParticipants[0]?.name}
                status={otherParticipants[0]?.status as any}
                onClick={() => setSelectedUserId(otherParticipants[0]?.user_id)}
                className="cursor-pointer"
              />
            )}
            <div>
              <h2 className="text-light-text dark:text-dark-text font-medium">
                {chat.is_group ? chat.group_name : otherParticipants[0]?.name}
              </h2>
              <p className="text-light-text/60 dark:text-dark-text/60 text-sm">
                {chat.is_group 
                  ? `${chat.participants.length} members`
                  : `@${otherParticipants[0]?.username}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-light-text/10 dark:hover:bg-dark-text/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (blockedUsers.includes(msg.sender_id)) return null;

          const isSender = msg.sender_id === currentUser?.id;

          return (
            <div
              key={msg.id}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              {!isSender && (
                <img
                  src={msg.sender?.avatar_url}
                  alt={msg.sender?.name}
                  className="w-8 h-8 rounded-full mr-2 cursor-pointer"
                  onClick={() => setSelectedUserId(msg.sender_id)}
                />
              )}
              <div className={`max-w-[70%] rounded-xl p-3 ${
                isSender 
                  ? 'bg-[#CCFF00] text-black' 
                  : 'bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text'
              }`}>
                {!isSender && (
                  <p className="text-sm font-medium mb-1">{msg.sender?.name}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-light-card dark:bg-dark-card">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-light-text/10 dark:hover:bg-dark-text/10 rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
          </button>
          <label className="p-2 hover:bg-light-text/10 dark:hover:bg-dark-text/10 rounded-lg transition-colors cursor-pointer">
            <Paperclip className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="flex-1 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 hover:bg-[#CCFF00]/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-[#CCFF00]" />
          </button>
        </div>
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

export default ChatWindow;