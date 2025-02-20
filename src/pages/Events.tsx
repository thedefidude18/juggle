import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import EventChat from '../components/EventChat';
import CategoryButton from '../components/CategoryButton';
import EventCard from '../components/EventCard';
import { Event } from '../hooks/useEvent';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEventPool } from '../hooks/useEventPool';
import { useAuth } from '../contexts/AuthContext';
import { useEvent } from '../hooks/useEvent';
import { useWallet } from '../hooks/useWallet';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const categories = [
  { id: 'create', icon: <Users />, label: 'Create Event', primary: true },
  { id: 'all', icon: '🌟', label: 'All Events' },
  { id: 'sports', icon: '⚽️', label: 'Sports' },
  { id: 'gaming', icon: '🎮', label: 'Gaming' },
  { id: 'politics', icon: '🗳️', label: 'Politics' },
  { id: 'entertainment', icon: '🎭', label: 'Entertainment' },
];

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showChat, setShowChat] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const { currentUser } = useAuth();
  const { wallet } = useWallet();
  const { joinEvent, getParticipants, isProcessing } = useEventParticipation();
  const { getEventPool } = useEventPool();
  const toast = useToast();
  const { events, loading: isLoading, fetchEvents } = useEvent();

  useEffect(() => {
    fetchEvents();

    const subscription = supabase
      .channel('events')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'events' 
        }, 
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEvents]);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'create') {
      navigate('/create');
      return;
    }
    setSelectedCategory(categoryId);
  };

  const handleJoinEvent = async (eventId: string, prediction: boolean) => {
    try {
      await joinEvent({
        eventId,
        userId: currentUser?.id || '',
        prediction,
        wagerAmount: 100 // You might want to make this dynamic
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error joining event:', error);
      toast.showError('Failed to join event');
    }
  };

  const filteredEvents = events.filter(event => 
    selectedCategory === 'all' || event.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {categories.map(category => (
            <CategoryButton
              key={category.id}
              icon={category.icon}
              label={category.label}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
              primary={category.primary}
            />
          ))}
        </div>

        {isLoading ? (
          <div>Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={handleJoinEvent}
                onChatClick={() => {
                  setSelectedEvent(event);
                  setShowChat(true);
                }}
              />
            ))}
          </div>
        )}
      </main>
      
      {showChat && selectedEvent && (
        <EventChat
          event={selectedEvent}
          onClose={() => setShowChat(false)}
        />
      )}
      
      <MobileFooterNav />
    </div>
  );
};

export default Events;
