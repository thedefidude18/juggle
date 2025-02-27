import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Paperclip, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from './UserAvatar';
import { useChatMessages } from '../hooks/useChat';

interface ChatWindowProps {
  chat: {
    id: string;
    participants: any[];
  };
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onBack }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { messages, sendMessage } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(chat.id, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement file upload logic here
  };

  const otherParticipant = chat.participants?.find(p => p.id !== currentUser?.id);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <UserAvatar
          src={otherParticipant?.avatar_url}
          alt={otherParticipant?.name || 'User'}
          size="md"
        />
        <div className="flex-1">
          <h2 className="font-semibold">{otherParticipant?.name || 'User'}</h2>
          <p className="text-sm text-light-text/60 dark:text-dark-text/60">
            {otherParticipant?.status || 'Offline'}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            {msg.senderId !== currentUser?.id && (
              <UserAvatar
                src={msg.sender?.avatar_url}
                alt={msg.sender?.name || 'User'}
                size="sm"
                className="mr-2"
              />
            )}
            <div
              className={`max-w-[70%] rounded-xl p-3 ${
                msg.senderId === currentUser?.id
                  ? 'bg-primary text-white'
                  : 'bg-light-card dark:bg-dark-card'
              }`}
            >
              <p className="break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2">
          <label className="p-2 hover:bg-light-hover dark:hover:bg-dark-hover rounded-full cursor-pointer">
            <Paperclip className="w-6 h-6" />
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*"
            />
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-light-bg dark:bg-dark-bg rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
