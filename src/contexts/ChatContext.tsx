import React, { createContext, useContext, useState } from 'react';
import type { ChatRoom, Message } from '@/types/chat';

interface ChatContextType {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  selectedChat: ChatRoom | null;
  setSelectedChat: (chat: ChatRoom | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);

  return (
    <ChatContext.Provider value={{
      activeChatId,
      setActiveChatId,
      unreadCount,
      setUnreadCount,
      selectedChat,
      setSelectedChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}