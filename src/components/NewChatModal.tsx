import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import { privyDIDtoUUID } from '../utils/auth';

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  is_following?: boolean;
}

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onChatCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<{
    sent: User[];
    received: User[];
  }>({ sent: [], received: [] });
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (searchQuery) {
      const searchUsers = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .neq('id', privyDIDtoUUID(currentUser?.id || ''))
            .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
            .limit(10);

          if (error) throw error;
          setUsers(data || []);
        } catch (error) {
          console.error('Error searching users:', error);
          toast.showError('Failed to search users');
        } finally {
          setLoading(false);
        }
      };

      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, currentUser?.id, toast]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!currentUser) return;

      try {
        const userId = privyDIDtoUUID(currentUser.id);

        // Fetch sent requests
        const { data: sentData } = await supabase
          .from('friend_requests')
          .select('recipient:recipient_id(*)')
          .eq('sender_id', userId)
          .eq('status', 'pending');

        // Fetch received requests
        const { data: receivedData } = await supabase
          .from('friend_requests')
          .select('sender:sender_id(*)')
          .eq('recipient_id', userId)
          .eq('status', 'pending');

        setFriendRequests({
          sent: sentData?.map(r => r.recipient) || [],
          received: receivedData?.map(r => r.sender) || []
        });
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    fetchFriendRequests();
  }, [currentUser]);

  const handleSendRequest = async (user: User) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const senderId = privyDIDtoUUID(currentUser.id);

      // Create friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: senderId,
          recipient_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'friend_request',
          title: 'New Friend Request',
          content: `${currentUser.name} sent you a friend request`,
          metadata: {
            sender_id: senderId
          }
        });

      // Update local state
      setFriendRequests(prev => ({
        ...prev,
        sent: [...prev.sent, user]
      }));

      toast.showSuccess('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.showError('Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (user: User) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const recipientId = privyDIDtoUUID(currentUser.id);

      // Update friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('sender_id', user.id)
        .eq('recipient_id', recipientId);

      if (updateError) throw updateError;

      // Create chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          is_group: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chat.id, user_id: recipientId },
          { chat_id: chat.id, user_id: user.id }
        ]);

      // Create notifications
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            type: 'friend_request_accepted',
            title: 'Friend Request Accepted',
            content: `${currentUser.name} accepted your friend request`,
            metadata: {
              chat_id: chat.id
            }
          }
        ]);

      // Update local state
      setFriendRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r.id !== user.id)
      }));

      toast.showSuccess('Friend request accepted!');
      onChatCreated();
      onClose();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.showError('Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-light-card dark:bg-dark-card rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-text/10 dark:border-dark-text/10">
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-light-text/10 dark:hover:bg-dark-text/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-light-text dark:text-dark-text" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text/40 dark:text-dark-text/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            />
          </div>
        </div>

        {/* Friend Requests */}
        {(friendRequests.received.length > 0 || friendRequests.sent.length > 0) && (
          <div className="px-4 mb-4">
            <h3 className="text-light-text/60 dark:text-dark-text/60 text-sm font-medium mb-2">
              Friend Requests
            </h3>
            <div className="space-y-2">
              {friendRequests.received.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-light-text dark:text-dark-text font-medium">{user.name}</p>
                      <p className="text-light-text/60 dark:text-dark-text/60 text-sm">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptRequest(user)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" color="#000000" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
              {friendRequests.sent.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-light-text dark:text-dark-text font-medium">{user.name}</p>
                      <p className="text-light-text/60 dark:text-dark-text/60 text-sm">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-light-text/10 dark:bg-dark-text/10 text-light-text/60 dark:text-dark-text/60 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="px-4 pb-4">
          {searchQuery && (
            <h3 className="text-light-text/60 dark:text-dark-text/60 text-sm font-medium mb-2">
              Search Results
            </h3>
          )}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length > 0 ? (
              users.map(user => {
                const isPending = friendRequests.sent.some(r => r.id === user.id);
                const hasRequest = friendRequests.received.some(r => r.id === user.id);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-light-text dark:text-dark-text font-medium">{user.name}</p>
                        <p className="text-light-text/60 dark:text-dark-text/60 text-sm">@{user.username}</p>
                      </div>
                    </div>
                    {isPending ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-light-text/10 dark:bg-dark-text/10 text-light-text/60 dark:text-dark-text/60 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Pending</span>
                      </div>
                    ) : hasRequest ? (
                      <button
                        onClick={() => handleAcceptRequest(user)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" color="#000000" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg font-medium hover:bg-[#CCFF00]/30 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Add Friend</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            ) : searchQuery && (
              <div className="text-center py-8 text-light-text/60 dark:text-dark-text/60">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;