import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  type: 'private' | 'group';
  created_by: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_image: boolean;
  replied_to?: string;
}

// Export both hook names for backward compatibility
export const useChat = useChatMessages;
export function useChatMessages() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all chats where the current user is a participant
      const { data: chatParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser.id);

      if (participantsError) throw participantsError;

      const chatIds = chatParticipants.map(cp => cp.chat_id);

      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      setChats(chatsData || []);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async (chatId: string) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    }
  }, [currentUser]);

  const sendMessage = useCallback(async (chatId: string, content: string, isImage = false) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          content,
          is_image: isImage
        })
        .select()
        .single();

      if (error) throw error;

      // Update the messages list
      setMessages(prev => [...prev, data]);

      // Update the chat's last message
      await supabase
        .from('chats')
        .update({ 
          last_message: isImage ? '📷 Image' : content,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
    }
  }, [currentUser]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('chat_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Refresh messages if it's for the current chat
          if (payload.new.chat_id === messages[0]?.chat_id) {
            fetchMessages(payload.new.chat_id);
          }
          // Refresh chat list to update last messages
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, fetchChats, fetchMessages, messages]);

  return {
    chats,
    messages,
    loading,
    error,
    fetchChats,
    fetchMessages,
    sendMessage
  };
}
