export interface User {
  id: string;
  name: string;
  avatar_url: string;
  status: 'online' | 'offline';
}

export interface ChatRoom {
  id: string;
  participants: string[];
  type: 'private' | 'group';
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: any; // Firebase Timestamp
  };
  // For group chats
  name?: string;
  avatar?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: any; // Firebase Timestamp
  readBy?: string[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
}

export interface TypingIndicator {
  user_id: string;
  event_id: string;
  last_typed: string;
}
