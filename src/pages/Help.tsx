import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, Clock, Shield, Book, FileText, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSupport } from '../hooks/useSupport';
import MobileFooterNav from '../components/MobileFooterNav';
import LoadingSpinner from '../components/LoadingSpinner';

const Help: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeTicket, messages, loading, createTicket, sendMessage } = useSupport();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      if (!activeTicket) {
        await createTicket(newMessage);
      } else {
        await sendMessage(newMessage);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const faqs = [
    {
      question: 'How do I create an event?',
      answer: 'To create an event, click the "+" button in the navigation bar and select "Create Event". Fill in the event details including title, description, category, and betting rules.'
    },
    {
      question: 'How do deposits and withdrawals work?',
      answer: 'You can deposit funds using bank transfer or card payment. Withdrawals are processed within 24 hours and sent directly to your registered bank account.'
    },
    {
      question: 'What happens if I win a bet?',
      answer: 'When you win a bet, your winnings are automatically credited to your wallet. The amount depends on the total pool and number of winners.'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px]">
      {/* Header */}
      <header className="bg-[#7C3AED] text-white p-4 sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Help & Support</h1>
            <p className="text-sm text-white/60">We typically reply within 5 minutes</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Chat Section */}
        <div className="flex flex-col h-[calc(100vh-180px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.sender_id && (
                  <div className="w-8 h-8 rounded-full bg-[#CCFF00]/20 flex items-center justify-center mr-2 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-[#CCFF00]" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-xl p-3 ${
                    msg.sender_id ? 'bg-[#CCFF00] text-black' : 'bg-[#242538] text-white'
                  }`}
                >
                  {msg.type === 'image' && msg.file_url && (
                    <img 
                      src={msg.file_url} 
                      alt="Attachment" 
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-[#242538]">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Paperclip className="w-5 h-5 text-white/60" />
              </button>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-[#1a1b2e] text-white px-4 py-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="p-2 hover:bg-[#CCFF00]/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-[#CCFF00]" />
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#242538] rounded-xl p-4">
                <h3 className="text-white font-medium mb-2">{faq.question}</h3>
                <p className="text-white/60">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Help;