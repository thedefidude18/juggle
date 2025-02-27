import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEvent } from '../hooks/useEvent';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import EventChat from '../components/EventChat';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryButton from '../components/CategoryButton';
import MobileFooterNav from '../components/MobileFooterNav';

interface Event {
  id: string;
  title: string;
  category: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  is_private: boolean;
  creator_id: string;
  end_time: string;
  wager_amount: number;
  max_participants: number;
  current_participants: number;
  start_time: string;
  pool?: {
    total_amount: number;
  };
  participants?: any[];
}

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { events, loading, joinEvent } = useEvent();
  const toast = useToast();

  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'sports', label: 'Sports', icon: '⚽️' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'gaming', label: 'Gaming', icon: '🎮' },
    { id: 'politics', label: 'Politics', icon: '🗳️' },
    { id: 'movies', label: 'Movies', icon: '🎬' },
    { id: 'crypto', label: 'Crypto', icon: '₿' },
  ];

  const handleChatClick = (event: Event) => {
    setSelectedEvent(event);
    setShowChat(true);
  };

  const handleJoinEvent = async (eventId: string, prediction: boolean) => {
    try {
      await joinEvent(eventId, prediction);
      toast.showSuccess('Successfully joined event');
    } catch (error) {
      toast.showError('Failed to join event');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' ? true : 
      event.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchQuery === '' ? true :
      event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] pb-[72px]">
      {/* Main App Header */}
      <Header />
      
      {/* Events Header */}
      <header className="bg-[#EDEDED] text-[#000000] p-4 sticky top-0 z-10 safe-top">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Events</h1>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Filter className="w-6 h-6" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr,400px] h-[calc(100vh-64px)]">
        <main className="container mx-auto px-4 py-8 overflow-y-auto">
          {/* Categories Section */}
          <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {categories.map(category => (
                <CategoryButton
                  key={category.id}
                  icon={category.icon}
                  label={category.label}
                  isSelected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={(prediction) => handleJoinEvent(event.id, prediction)}
                onChatClick={() => handleChatClick(event)}
              />
            ))}
          </div>
        </main>
        
        {/* Chat Panel */}
        <div className={`fixed inset-0 z-50 lg:relative lg:z-0 ${showChat ? 'block' : 'hidden lg:hidden'}`}>
          {showChat && selectedEvent && (
            <EventChat
              eventId={selectedEvent.id}
              onClose={() => setShowChat(false)}
            />
          )}
        </div>
      </div>

      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
    </div>
  );
};

export default Events;
