import React from 'react';
import { useChatList } from '@/hooks/useChatList';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';

export function ChatList() {
  const { currentUser } = useAuth();
  const { chats, loading, error } = useChatList(currentUser?.id || '');
  const { setActiveChatId, setSelectedChat } = useChat();

  if (loading) return <div className="p-4">Loading chats...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  const handleChatSelect = (chat: any) => {
    setActiveChatId(chat.id);
    setSelectedChat(chat);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const otherParticipant = chat.participants.find(p => p !== currentUser?.id);
          const isGroup = chat.type === 'group';
          
          return (
            <div
              key={chat.id}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b"
              onClick={() => handleChatSelect(chat)}
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  src={isGroup ? chat.avatar : otherParticipant?.avatar}
                  alt={isGroup ? chat.name : otherParticipant?.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium truncate">
                      {isGroup ? chat.name : otherParticipant?.name}
                    </h3>
                    {chat.lastMessage?.timestamp && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}