import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface Chat {
  id: string;
  event_id?: string;
  chat_id?: string;
  last_message?: string;
  last_message_at?: string;
  participants: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  }[];
}

export function useChat() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Fetch event chats
      const { data: eventChats, error: eventError } = await supabase
        .from('event_participants')
        .select(`
          event:events (
            id,
            title,
            created_at,
            creator:users!creator_id (
              id,
              name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');

      if (eventError) throw eventError;

      // Fetch private chats
      const { data: privateChats, error: privateError } = await supabase
        .from('private_chat_participants')
        .select(`
          chat:private_chats (
            id,
            created_at,
            participants:private_chat_participants (
              user:users (
                id,
                name,
                username,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', currentUser.id);

      if (privateError) throw privateError;

      // Combine and format chats
      const formattedChats: Chat[] = [
        ...eventChats.map(({ event }) => ({
          id: event.id,
          event_id: event.id,
          participants: [event.creator],
          created_at: event.created_at,
        })),
        ...privateChats.map(({ chat }) => ({
          id: chat.id,
          chat_id: chat.id,
          participants: chat.participants
            .map(p => p.user)
            .filter(user => user.id !== currentUser.id),
          created_at: chat.created_at,
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.showError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  const createPrivateChat = async (friendId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    const { data: existing, error: checkError } = await supabase
      .from('private_chat_participants')
      .select('chat_id')
      .eq('user_id', currentUser.id)
      .eq('chat_id', supabase.from('private_chat_participants').select('chat_id').eq('user_id', friendId));

    if (checkError) throw checkError;

    // If chat exists, return it
    if (existing.length > 0) {
      const { data: chat, error: chatError } = await supabase
        .from('private_chats')
        .select(`
          id,
          created_at,
          participants:private_chat_participants (
            user:users (
              id,
              name,
              username,
              avatar_url
            )
          )
        `)
        .eq('id', existing[0].chat_id)
        .single();

      if (chatError) throw chatError;
      return chat;
    }

    // Create new chat
    const { data: chat, error: createError } = await supabase
      .from('private_chats')
      .insert({})
      .select()
      .single();

    if (createError) throw createError;

    // Add participants
    const { error: participantsError } = await supabase
      .from('private_chat_participants')
      .insert([
        { chat_id: chat.id, user_id: currentUser.id },
        { chat_id: chat.id, user_id: friendId }
      ]);

    if (participantsError) throw participantsError;

    return chat;
  };

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    loading,
    fetchChats,
    createPrivateChat
  };
}
