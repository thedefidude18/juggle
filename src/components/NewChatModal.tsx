import React, { useState, useCallback, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  status?: 'online' | 'offline' | 'away' | 'sleeping';
}

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (chat: Chat) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onChatCreated }) => {
  const [search, setSearch] = useState('');
  const { currentUser } = useAuth();
  const { createPrivateChat } = useChat();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Search users function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !currentUser?.id) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url, status')
        .neq('id', currentUser.id) // Exclude current user
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .order('username')
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
      return [];
    }
  }, [currentUser?.id, toast]);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const results = await searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        toast.showError('Failed to search users');
      } finally {
        setSearching(false);
      }
    },
    [searchUsers, toast]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, debouncedSearch]);

  const handleSelectUser = async (userId: string) => {
    try {
      setCreating(true);
      const chat = await createPrivateChat(userId);
      onChatCreated(chat);
      onClose();
      toast.showSuccess('Chat created successfully');
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.showError('Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-light-card dark:bg-dark-card rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-light-hover dark:hover:bg-dark-hover rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-light-hover dark:bg-dark-hover rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={creating}
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {searching ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-light-text/60 dark:text-dark-text/60">
              {search.trim() ? 'No users found' : 'Start typing to search users'}
            </div>
          ) : (
            searchResults.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                disabled={creating}
                className="w-full p-4 flex items-center gap-3 hover:bg-light-hover dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserAvatar
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  size="md"
                />
                <div className="flex-1 text-left">
                  <div className="font-semibold">{user.name || 'Anonymous'}</div>
                  <div className="text-sm text-light-text/60 dark:text-dark-text/60">
                    @{user.username}
                  </div>
                </div>
                {creating && user.id === searchResults[0]?.id && (
                  <LoadingSpinner size="sm" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
