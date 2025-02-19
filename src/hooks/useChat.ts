import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { privyDIDtoUUID } from '../utils/auth';

export interface Chat {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  is_group: boolean;
  group_name?: string;
  group_avatar?: string;
  participants: {
    user_id: string;
    name: string;
    avatar_url: string;
    last_read: string;
    status: string;
  }[];
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchChats = useCallback(async () => {
    if (!currentUser?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log('Fetching chats...');

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participants:chat_participants(
            user_id,
            last_read,
            users(
              name,
              avatar_url,
              status
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase Fetch Error:', error);
        throw error;
      }

      const formattedChats = data?.map(chat => ({
        ...chat,
        participants: chat.participants?.map((p: any) => ({
          user_id: p.user_id,
          name: p.users?.name || 'Unknown',
          avatar_url: p.users?.avatar_url || '',
          last_read: p.last_read,
          status: p.users?.status || 'offline',
        })) || [],
      })) || [];

      setChats(formattedChats);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Failed to load chats');
      toast.showError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const fetchMessages = useCallback(async (chatId: string) => {
    if (!currentUser?.id || !chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id,
            name,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);

      // Subscribe to new messages
      const subscription = supabase
        .channel(`chat:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          payload => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      toast.showError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const sendMessage = useCallback(async (chatId: string | number | null, content: string) => {
    if (!currentUser?.id || !content?.trim()) {
      throw new Error('Message content is required.');
    }

    try {
      setError(null);

      const chatIdStr = String(chatId);
      console.log('Chat ID Type:', typeof chatIdStr, 'Value:', chatIdStr);

      if (!chatIdStr) {
        throw new Error('Chat ID is missing.');
      }

      // Modified validation to accept both UUID and numeric IDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const numericRegex = /^\d+$/;
      
      if (!uuidRegex.test(chatIdStr) && !numericRegex.test(chatIdStr)) {
        throw new Error(`Invalid chat ID format: ${chatIdStr}`);
      }

      const userId = privyDIDtoUUID(currentUser.id);
      if (!uuidRegex.test(userId)) {
        throw new Error(`Invalid user ID format: ${userId}`);
      }

      const messageData = {
        chat_id: chatIdStr,
        sender_id: userId,
        content: content.trim(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select('*, sender:users!messages_sender_id_fkey(id, name, avatar_url)')
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from message insert');
      }

      console.log('Message sent:', data);
      setMessages(prev => [...prev, data]);

      // Update chat's last message timestamp
      await supabase
        .from('chats')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message: content.trim()
        })
        .eq('id', chatIdStr);

      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      throw err;
    }
  }, [currentUser?.id]);

  const sendEventMessage = useCallback(async (eventId: string, content: string) => {
    if (!currentUser?.id || !content?.trim()) {
      throw new Error('Message content is required.');
    }

    try {
      setError(null);
      const userId = privyDIDtoUUID(currentUser.id);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(eventId)) {
        throw new Error(`Invalid event ID format: ${eventId}`);
      }

      const messageData = {
        sender_id: userId,
        event_id: eventId,
        content: content.trim(),
        type: 'event_message'
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Event message sent:', data);
      return data;
    } catch (err) {
      console.error('Error sending event message:', err);
      setError('Failed to send message');
      throw err;
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    messages,
    loading,
    error,
    sendMessage,      // for regular chats (UUID)
    sendEventMessage, // for event chats (numeric)
    fetchChats,
    fetchMessages
  };
}
