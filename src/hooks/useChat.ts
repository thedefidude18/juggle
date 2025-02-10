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

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      const formattedChats = data?.map(chat => ({
        ...chat,
        participants: chat.participants.map((p: any) => ({
          user_id: p.user_id,
          name: p.users.name,
          avatar_url: p.users.avatar_url,
          last_read: p.last_read,
          status: p.users.status || 'offline'
        }))
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
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
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

  const sendMessage = useCallback(async (chatId: string, content: string) => {
    if (!currentUser?.id || !content?.trim()) {
      throw new Error('Message content is required.');
    }

    try {
      setError(null);
      const userId = privyDIDtoUUID(currentUser.id);

      // Check if content is a challenge
      let challengeData;
      try {
        challengeData = JSON.parse(content);
      } catch (e) {
        // Not JSON, treat as regular message
      }

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          content: content.trim()
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // If this is a challenge message, create challenge record
      if (challengeData?.type === 'challenge') {
        const { error: challengeError } = await supabase
          .from('challenges')
          .insert({
            challenger_id: userId,
            challenged_id: chatId, // The chat participant who isn't the sender
            message_id: message.id,
            amount: challengeData.amount,
            expires_at: challengeData.expires_at
          });

        if (challengeError) throw challengeError;
      }

      // Update chat's last message
      const { error: updateError } = await supabase
        .from('chats')
        .update({
          last_message: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      toast.showSuccess('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      toast.showError('Failed to send message');
      throw err;
    }
  }, [currentUser, toast]);

  const createChat = useCallback(async (participantIds: string[], isGroup: boolean = false) => {
    if (!currentUser?.id) return null;

    try {
      setError(null);
      const userId = privyDIDtoUUID(currentUser.id);

      // Create chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          is_group: isGroup,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const participants = [userId, ...participantIds].map(id => ({
        chat_id: chat.id,
        user_id: id,
        joined_at: new Date().toISOString(),
        last_read: new Date().toISOString()
      }));

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantError) throw participantError;

      return chat;
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat');
      toast.showError('Failed to create chat');
      return null;
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    messages,
    loading,
    error,
    sendMessage,
    fetchMessages,
    fetchChats,
    createChat,
  };
}