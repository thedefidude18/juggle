export interface User {
  id: string;
  name: string;
  avatar_url: string;
  status: 'online' | 'offline';
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  event_id: string;
  sender_id: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string;
    status: string;
  };
  reactions: MessageReaction[];
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
