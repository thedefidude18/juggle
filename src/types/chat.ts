export interface User {
  id: string;
  name: string;
  avatar_url: string;
  status: 'online' | 'offline';
}

export interface Message {
  id: string;
  event_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  created_at: string;
  updated_at: string;
  // Fields from the user profile
  username: string;
  name: string;
  avatar_url?: string;
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
