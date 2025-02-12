import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Plus, UserPlus, Bell } from 'lucide-react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import NewChatModal from '../components/NewChatModal';
import MobileFooterNav from '../components/MobileFooterNav';
import { Chat, useChat } from '../hooks/useChat';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../hooks/useNotification';

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const { loading, fetchChats } = useChat();
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
      <header className="bg-[#EDEDED] text-black p-4 sticky top-0 z-10 safe-top flex justify-center items-center relative">
  <button
    onClick={() => window.history.back()}
    className="absolute left-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30"
  >
    {/* Use an appropriate back arrow icon here */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  </button>
  <div className="flex items-center justify-between w-full px-4">
    <div className="flex items-center gap-2 pl-12">
      <h1 className="text-medium font-bold text-center flex-grow">Messages</h1>
    </div>
    <div className="flex items-center gap-2">
      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
        <Search className="w-5 h-5" />
      </button>
      <button
        onClick={() => setShowNewChat(true)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <UserPlus className="w-5 h-5" />
        {friendRequests > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#CCFF00] text-black text-sm font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {friendRequests}
          </span>
        )}
      </button>
    </div>
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
            <div className="flex flex-col items-center justify-center h-full text-light-text/60 dark:text-dark-text/60">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={() => {
            fetchChats();
            setShowNewChat(false);
          }}
        />
      )}

      <MobileFooterNav />
    </div>
  );
};

export default Messages;