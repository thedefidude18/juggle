import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Plus, UserPlus, Bell, ArrowLeft } from 'lucide-react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import NewChatModal from '../components/NewChatModal';
import MobileFooterNav from '../components/MobileFooterNav';
import { Chat, useChat } from '../hooks/useChat';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../hooks/useNotification';
import { useNavigate } from 'react-router-dom';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const { chats, loading, fetchChats } = useChat();
  const { notifications } = useNotification();

  // Filter friend request notifications
  const friendRequests = notifications.filter(n => 
    n.type === 'friend_request' && !n.read_at
  ).length;

  useEffect(() => {
    fetchChats().catch(console.error);
  }, [fetchChats]);

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] dark:bg-dark-bg pb-[72px] lg:pb-0">
      {/* Header */}
      <header className="bg-[#EDEDED] text-black p-4 sticky top-0 z-10 safe-top flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-black/5"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 hover:bg-black/5 rounded-full"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigate('/friend-requests')}
            className="p-2 hover:bg-black/5 rounded-full relative"
          >
            <UserPlus className="w-6 h-6" />
            {friendRequests > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                {friendRequests}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[350px,1fr] h-[calc(100vh-72px)] lg:h-[calc(100vh-64px)]">
        {/* Chat List - Always visible on desktop, visible on mobile when no chat is selected */}
        <div className={`bg-light-card dark:bg-dark-card ${showMobileChat ? 'hidden lg:block' : ''}`}>
          <ChatList
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChat?.id}
          />
        </div>

        {/* Chat Window - Always visible on desktop, visible on mobile when chat is selected */}
        <div className={`bg-light-bg dark:bg-dark-bg ${!showMobileChat ? 'hidden lg:block' : ''}`}>
          {selectedChat ? (
            <ChatWindow 
              chat={selectedChat} 
              onBack={() => setShowMobileChat(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-light-text/60 dark:text-dark-text/60">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}

      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
    </div>
  );
};

export default Messages;
