import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface Chat {
  id: string;
  created_at: string;
  participants: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
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
      
      const { data: userChats, error: chatsError } = await supabase
        .from('chat_participants')
        .select(`
          chat:private_chats!chat_id (
            id,
            created_at,
            participants:chat_participants!chat_id (
              user:users!user_id (
                id,
                name,
                username,
                avatar_url
              )
            ),
            messages:chat_messages (
              content,
              created_at,
              sender_id
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { foreignTable: 'private_chats', ascending: false });

      if (chatsError) throw chatsError;

      const formattedChats = userChats.map(({ chat }) => ({
        id: chat.id,
        created_at: chat.created_at,
        participants: chat.participants.map(p => p.user),
        last_message: chat.messages[0]
      }));

      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.showError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  const createPrivateChat = async (userId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    // Check if chat already exists
    const { data: existingChat, error: checkError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', currentUser.id)
      .in('chat_id', 
        supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', userId)
      );

    if (checkError) throw checkError;

    // If chat exists, return it
    if (existingChat && existingChat.length > 0) {
      const { data: chat, error: chatError } = await supabase
        .from('private_chats')
        .select(`
          id,
          created_at,
          participants:chat_participants!chat_id (
            user:users!user_id (
              id,
              name,
              username,
              avatar_url
            )
          )
        `)
        .eq('id', existingChat[0].chat_id)
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
      .from('chat_participants')
      .insert([
        { chat_id: chat.id, user_id: currentUser.id },
        { chat_id: chat.id, user_id: userId }
      ]);

    if (participantsError) throw participantsError;

    // Fetch the complete chat with participants
    const { data: newChat, error: fetchError } = await supabase
      .from('private_chats')
      .select(`
        id,
        created_at,
        participants:chat_participants!chat_id (
          user:users!user_id (
            id,
            name,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', chat.id)
      .single();

    if (fetchError) throw fetchError;
    return newChat;
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
