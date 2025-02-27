import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Phone, Video, Info, Image, Smile, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import UserAvatar from '../components/UserAvatar';
import MobileFooterNav from '../components/MobileFooterNav';

// Temporary type definitions until we properly integrate with backend
interface Chat {
  id: string;
  title: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount?: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Temporary state until we integrate the chat hook
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
    }
  }, [currentUser, navigate]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;
    // Implement send message logic later
    setMessageText('');
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="lg:grid lg:grid-cols-[350px,1fr] h-screen">
        {/* Chat List Sidebar */}
        <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
          ${showMobileChat ? 'hidden lg:block' : ''}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 
                  text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto h-[calc(100vh-140px)]">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No chats available
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat);
                    setShowMobileChat(true);
                  }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800
                    ${selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                >
                  <UserAvatar
                    src={chat.avatar}
                    alt={chat.title}
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.lastMessage?.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage?.content}
                    </p>
                  </div>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold rounded-full 
                      w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`bg-white dark:bg-gray-900 flex flex-col h-full 
          ${!showMobileChat ? 'hidden lg:flex' : ''}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <UserAvatar
                  src={selectedChat.avatar}
                  alt={selectedChat.title}
                  size="lg"
                />
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {selectedChat.title}
                  </h2>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 
                      ${message.senderId === currentUser.uid 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}
                    >
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 
                      text-gray-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 
                      rounded-full disabled:opacity-50"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileFooterNav />
    </div>
  );
};

export default Messages;
