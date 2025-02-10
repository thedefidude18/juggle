import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface SupportTicket {
  id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  created_at: string;
  read_at?: string;
}

export function useSupport() {
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  // Fetch or create active ticket
  const getActiveTicket = useCallback(async () => {
    if (!currentUser) return null;

    try {
      // Check for existing open ticket
      const { data: existingTicket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', currentUser.id)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingTicket) {
        setActiveTicket(existingTicket);
        return existingTicket;
      }

      return null;
    } catch (error) {
      console.error('Error fetching active ticket:', error);
      return null;
    }
  }, [currentUser]);

  // Create new ticket
  const createTicket = useCallback(async (message: string) => {
    if (!currentUser) return null;

    try {
      const { data: ticketId, error } = await supabase
        .rpc('create_support_ticket', {
          p_user_id: currentUser.id,
          p_initial_message: message
        });

      if (error) throw error;

      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      setActiveTicket(ticket);
      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.showError('Failed to create support ticket');
      return null;
    }
  }, [currentUser, toast]);

  // Send message
  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
    if (!currentUser || !activeTicket) return null;

    try {
      const { data: message, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: activeTicket.id,
          sender_id: currentUser.id,
          content,
          type,
          file_url: fileUrl
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Failed to send message');
      return null;
    }
  }, [currentUser, activeTicket, toast]);

  // Fetch messages for active ticket
  useEffect(() => {
    if (!activeTicket) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', activeTicket.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.showError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`ticket:${activeTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${activeTicket.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMessage]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeTicket, toast]);

  // Initialize
  useEffect(() => {
    getActiveTicket();
  }, [getActiveTicket]);

  return {
    activeTicket,
    messages,
    loading,
    createTicket,
    sendMessage
  };
}