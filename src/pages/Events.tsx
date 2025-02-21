import React, { useState } from 'react';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEvent } from '../hooks/useEvent';
import { useToast } from '../contexts/ToastContext';
import EventCard from '../components/EventCard';
import EventChat from '../components/EventChat';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const { events, loading, joinEvent } = useEvent();
  const toast = useToast();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="lg:grid lg:grid-cols-[1fr,400px] h-[calc(100vh-64px)]">
        <main className="container mx-auto px-4 py-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {events.map(event => (
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
              event={selectedEvent}
              onClose={() => setShowChat(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
