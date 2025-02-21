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

interface Event {
  id: string;
  title: string;
  end_time: string;
  participants: string[];
  pool: {
    total_amount: number;
  };
  creator: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  yesVotes?: number;
  noVotes?: number;
}

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
  const [selectedEvent, setSelectedEvent] = useState({
    id: '1',
    title: 'Sample Event',
    end_time: new Date(Date.now() + 86400000).toISOString(),
    participants: [],
    pool: {
      total_amount: 100000
    },
    creator: {
      id: 'creator123',
      name: 'John Doe',
      avatar_url: null // Will fall back to DiceBear avatar
    }
  });
  
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

  const handleChatClick = (event: Event) => {
    setSelectedEvent(event);
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="lg:grid lg:grid-cols-[1fr,400px] h-[calc(100vh-64px)]">
        <main className="container mx-auto px-4 py-8 overflow-y-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={(prediction) => handleJoinEvent(event.id, prediction)}
                  onChatClick={() => handleChatClick(event)}
                />
              ))}
            </div>
          )}
        </main>
        
        <div className={`fixed inset-0 z-50 lg:relative lg:z-0 ${showChat ? 'block' : 'hidden lg:hidden'}`}>
          {showChat && selectedEvent && (
            <EventChat
              event={selectedEvent}
              onClose={() => setShowChat(false)}
            />
          )}
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Events;
