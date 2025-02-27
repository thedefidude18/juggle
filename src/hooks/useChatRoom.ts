import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { ChatService } from '@/services/chatService';
import type { Message, ChatRoom } from '@/types/chat';

export function useChatRoom(chatId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!chatId || !userId) return;

    setLoading(true);
    setError(null);

    // Subscribe to chat room updates
    const unsubscribeRoom = onSnapshot(
      doc(db, 'chats', chatId),
      async (doc) => {
        if (doc.exists()) {
          const chatData = { id: doc.id, ...doc.data() } as ChatRoom;
          setChatRoom(chatData);
          
          // Fetch participant details if needed
          // You might want to keep user profiles in Supabase
          // and fetch them using the participant IDs
        } else {
          setError('Chat room not found');
        }
      },
      (error) => {
        console.error('Chat room subscription error:', error);
        setError(error.message);
      }
    );

    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Message)
          .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
        setMessages(newMessages);
        setLoading(false);
      },
      (error) => {
        console.error('Messages subscription error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
    };
  }, [chatId, userId]);

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!chatRoom) throw new Error('Chat room not found');
    
    try {
      await ChatService.sendMessage(chatId, userId, content, type);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      throw err;
    }
  };

  const markAsRead = async () => {
    if (!chatRoom) return;
    
    try {
      await ChatService.markMessagesAsRead(chatId, userId);
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    messages,
    chatRoom,
    participants,
    loading,
    error,
    sendMessage,
    markAsRead
  };
}
