import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import EventChat from '../components/EventChat';
import CategoryButton from '../components/CategoryButton';
import { Event } from '../hooks/useEvent';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showChat, setShowChat] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Categories with icons and counts
  const categories = [
    { 
      id: 'create', 
      icon: <img src="/assets/images/myevents-icon.png" alt="Create Icon" className="w-13 h-13" />, 
      label: 'Create', 
      primary: true 
    },
    { 
      id: 'sports', 
      icon: <img src="/assets/images/sportscon.svg" alt="Sports Icon" className="w-13 h-13" />,  
      label: 'Sports', 
      count: 28, 
      chatRoom: {
        id: 'sports-room',
        title: 'Sports Events',
        creator: {
          id: 'system',
          name: 'Bantah Sports',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sports'
        },
        pool: { amount: 0, participants: 0 },
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      id: 'music',
      icon: <img src="/src/musicsvg.svg" alt="Create Icon" className="w-13 h-13" />, 
      label: 'Music',
      count: 22,
      chatRoom: {
        id: 'music-room',
        title: 'Music Events',
        creator: {
          id: 'system',
          name: 'Bantah Music',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=music'
        },
      pool: { amount: 0, participants: 0 },
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }},
    { id: 'gaming', icon: <img src="/src/gamingsvg.svg" alt="Create Icon" className="w-13 h-13" />,  label: 'Gaming', count: 19, chatRoom: {
      id: 'gaming-room',
      title: 'Gaming Events',
      creator: {
        id: 'system',
        name: 'Bantah Gaming',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaming'
      },
      pool: { amount: 0, participants: 0 },
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }},
    { id: 'crypto', icon: <img src="/src/cryptosvg.svg" alt="Create Icon" className="w-13 h-13" />,  label: 'Politics', count: 15, chatRoom: {
      id: 'crypto',
      title: 'Crypto Events',
      creator: {
        id: 'system',
        name: 'Bantah Crypto',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=politics'
      },
      pool: { amount: 0, participants: 0 },
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }},
    { id: 'entertainment', icon: <img src="/src/moviesicon.svg" alt="Create Icon" className="w-13 h-13" />,  label: 'Entertainment', count: 12, chatRoom: {
      id: 'entertainment-room',
      title: 'Entertainment Events',
      creator: {
        id: 'system',
        name: 'Bantah Entertainment',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=entertainment'
      },
      pool: { amount: 0, participants: 0 },
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }},
    { id: 'politics', icon: <img src="/src/poltiii.svg" alt="Create Icon" className="w-13 h-13" />,  label: 'Politics', count: 15, chatRoom: {
      id: 'politics-room',
      title: 'Politics Events',
      creator: {
        id: 'system',
        name: 'Bantah Politics',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=politics'
      },
      pool: { amount: 0, participants: 0 },
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }}
  ];

  // Mock events data
  const mockEvents = [
    {
      id: '1',
      title: 'Manchester united will beat chelsea tomorrow',
      creator: {
        id: 'mikki24',
        name: 'Mikki',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mikki'
      },
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop',
      pool: {
        amount: 2500,
        participants: 65
      },
      status: 'live',
      category: 'sports'
    },
    {
      id: '2',
      title: 'Rema for grammy 2025',
      creator: {
        id: 'mikki24',
        name: 'Mikki',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mikki'
      },
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
      pool: {
        amount: 2500,
        participants: 65
      },
      status: 'live',
      category: 'music'
    },
    {
      id: '3',
      title: 'Who go win this fight!!! 30BG VS FC',
      creator: {
        id: 'mikki24',
        name: 'Mikki',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mikki'
      },
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop',
      pool: {
        amount: 2500,
        participants: 65
      },
      status: 'live',
      category: 'entertainment'
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'create') {
      navigate('/create');
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    if (category?.chatRoom) {
      setSelectedEvent(category.chatRoom);
      setShowChat(true);
    }
    
    setSelectedCategory(categoryId);
  };

  const filteredEvents = selectedCategory === 'all' 
    ? mockEvents 
    : mockEvents.filter(event => event.category === selectedCategory);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg pb-[72px]">
      <Header />

      {/* Categories */}
      <div className="p-2">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-0 min-w-max pb-1.5">
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                icon={category.icon}
                label={category.label}
                primary={category.primary}
                onClick={() => handleCategoryClick(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4 mt-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-[#242538] rounded-xl overflow-hidden">
              <div className="relative">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#CCFF00] text-black px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <span className="w-2 h-2 bg-black rounded-full mr-2 animate-pulse"></span>
                      LIVE
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg mb-2">{event.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={event.creator.avatar}
                        alt={event.creator.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-white/60 text-sm">@{event.creator.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-[#7C3AED] text-white px-3 py-1 rounded-full text-sm">
                        ₦ {event.pool.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <Users className="w-4 h-4" />
                        <span>+{event.pool.participants}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowChat(true);
                  }}
                  className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Overlay */}
      {showChat && selectedEvent && (
        <div className="fixed inset-0 z-50">
          <EventChat
            event={selectedEvent}
            onClose={() => {
              setShowChat(false);
              setSelectedEvent(null);
            }}
          />
        </div>
      )}

      <MobileFooterNav />
    </div>
  );
};

export default Events;
