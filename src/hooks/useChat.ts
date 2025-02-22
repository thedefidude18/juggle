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

      // Fetch chats for the current user
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
            last_message:messages (
              content,
              created_at,
              sender_id
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { foreignTable: 'private_chats', ascending: false });

      if (chatsError) {
        console.error('Error in chat query:', chatsError);
        throw chatsError;
      }

      if (!userChats) {
        setChats([]);
        return;
      }

      // Format the fetched chats
      const formattedChats = userChats
        .filter(chat => chat.chat) // Filter out any null chat entries
        .map(({ chat }) => ({
          id: chat.id,
          created_at: chat.created_at,
          participants: chat.participants
            .filter(p => p.user) // Filter out any null user entries
            .map(p => p.user),
          last_message: chat.last_message && chat.last_message.length > 0 
            ? chat.last_message[0] 
            : undefined
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
    if (userId === currentUser.id) throw new Error('Cannot create chat with yourself');

    try {
      // Check for existing chat
      const { data: existingChats, error: existingError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser.id);

      if (existingError) throw existingError;

      if (existingChats && existingChats.length > 0) {
        const existingChatIds = existingChats.map(chat => chat.chat_id);

        const { data: sharedChat, error: sharedError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', userId)
          .in('chat_id', existingChatIds)
          .single();

        if (sharedError && sharedError.code !== 'PGRST116') { // Ignore "no rows returned" error
          throw sharedError;
        }

        if (sharedChat) {
          // Return existing chat
          const { data: chat, error: chatError } = await supabase
            .from('private_chats')
            .select(`
              id,
              created_at,
              participants:chat_participants (
                user:users (
                  id,
                  name,
                  username,
                  avatar_url
                )
              )
            `)
            .eq('id', sharedChat.chat_id)
            .single();

          if (chatError) throw chatError;
          return chat;
        }
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('private_chats')
        .insert({})
        .select()
        .single();

      if (createError) throw createError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: currentUser.id },
          { chat_id: newChat.id, user_id: userId }
        ]);

      if (participantsError) throw participantsError;

      // Fetch complete chat details
      const { data: chat, error: fetchError } = await supabase
        .from('private_chats')
        .select(`
          id,
          created_at,
          participants:chat_participants (
            user:users (
              id,
              name,
              username,
              avatar_url
            )
          )
        `)
        .eq('id', newChat.id)
        .single();

      if (fetchError) throw fetchError;
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.showError('Failed to create chat');
      throw error;
    }
  };

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    loading,
    fetchChats,
    createPrivateChat,
  };
}