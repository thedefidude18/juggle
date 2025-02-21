import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Chat } from '../types/chat';
import { useChat } from '../hooks/useChat';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { currentUser } = useAuth();
  const { chats, loading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.participants.some(p =>
      p.user_id !== currentUser?.id &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
      {/* Search Header */}
      <div className="p-4 border-b border-light-border dark:border-dark-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text/40 dark:text-dark-text/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages"
            className="w-full bg-light-card dark:bg-dark-card rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-light-text/60 dark:text-dark-text/60">
            No chats found
          </div>
        ) : (
          filteredChats.map(chat => {
            const otherParticipant = chat.participants.find(
              p => p.user_id !== currentUser?.id
            );

            return (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors ${
                  chat.id === selectedChatId ? 'bg-light-hover dark:bg-dark-hover' : ''
                }`}
              >
                <UserAvatar
                  src={otherParticipant?.avatar_url}
                  alt={otherParticipant?.name || 'User'}
                  size="md"
                />
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">{otherParticipant?.name}</h3>
                  <p className="text-sm text-light-text/60 dark:text-dark-text/60 truncate">
                    {chat.last_message?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
