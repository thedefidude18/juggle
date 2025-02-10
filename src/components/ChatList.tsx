import React, { useState } from 'react';
import { format } from 'date-fns';
import { useChat, Chat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import ProfileCard from './ProfileCard';
import { Search, Plus } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { chats, loading } = useChat();
  const { currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUserClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserId(userId);
  };

  const filteredChats = chats.filter(chat => 
    chat.is_group 
      ? chat.group_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : chat.participants.some(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user_id.toLowerCase().includes(searchQuery.toLowerCase())
        )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
      {/* Search Header */}
      <div className="p-4 border-b border-light-text/10 dark:border-dark-text/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text/40 dark:text-dark-text/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages"
            className="w-full bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-light-text/60 dark:text-dark-text/60">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start chatting with other users!</p>
          </div>
        ) : (
          <div className="divide-y divide-light-text/10 dark:divide-dark-text/10">
            {filteredChats.map((chat) => {
              const otherParticipants = chat.participants.filter(p => p.user_id !== currentUser?.id);
              const chatName = chat.is_group 
                ? chat.group_name 
                : otherParticipants[0]?.name;
              const chatAvatar = chat.is_group
                ? chat.group_avatar
                : otherParticipants[0]?.avatar_url;
              const otherUserId = otherParticipants[0]?.user_id;
              const userStatus = otherParticipants[0]?.status || 'offline';

              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-4 flex items-center gap-4 hover:bg-light-card/50 dark:hover:bg-dark-card/50 transition-colors ${
                    selectedChatId === chat.id ? 'bg-light-card dark:bg-dark-card' : ''
                  }`}
                >
                  {chat.is_group ? (
                    <div className="w-12 h-12 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-[#CCFF00]">
                      <span className="font-bold text-lg">
                        {chat.group_name?.[0].toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <UserAvatar
                      src={chatAvatar}
                      alt={chatName}
                      size="lg"
                      status={userStatus as 'online' | 'offline' | 'away' | 'sleeping'}
                      className="cursor-pointer"
                      onClick={(e) => otherUserId && handleUserClick(otherUserId, e)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-light-text dark:text-dark-text font-medium truncate">
                        {chatName}
                      </h3>
                      <span className="text-light-text/60 dark:text-dark-text/60 text-sm">
                        {format(new Date(chat.updated_at), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-light-text/60 dark:text-dark-text/60 text-sm truncate">
                      {chat.last_message}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-light-text/10 dark:border-dark-text/10">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors">
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {selectedUserId && (
        <ProfileCard 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
};

export default ChatList;