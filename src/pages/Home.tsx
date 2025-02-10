import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Trophy, TrendingUp, Search, Filter, ArrowRight } from 'lucide-react';
import EventCard from '../components/EventCard';
import CategoryButton from '../components/CategoryButton';
import GroupCard from '../components/GroupCard';
import MobileDrawer from '../components/MobileDrawer';
import MobileFooterNav from '../components/MobileFooterNav';
import DesktopNav from '../components/DesktopNav';
import Header from '../components/Header';
import { useEvent } from '../hooks/useEvent';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Home() {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { currentUser } = useAuth();
  const { events, loading, joinEvent, fetchEvents } = useEvent();
  const toast = useToast();

  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        fetchEvents(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [fetchEvents]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const categories = [
    { id: 'create', icon: <Plus />, label: 'Create Group', primary: true },
    { id: 'sports', icon: '⚽️', label: 'Sports' },
    { id: 'gaming', icon: '🎮', label: 'Gaming' },
    { id: 'music', icon: '🎵', label: 'Music' },
    { id: 'politics', icon: '🗳️', label: 'Politics' },
    { id: 'social', icon: '👥', label: 'Social' },
  ];

  const trendingGroups = [
    {
      id: 1,
      name: "Premier League Bets",
      image: "https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=800&auto=format&fit=crop",
      members: 2453,
      activeEvents: 12,
      category: "Sports"
    },
    {
      id: 2,
      name: "Afrobeats Predictions",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop",
      members: 1829,
      activeEvents: 8,
      category: "Music"
    }
  ];

  const featuredEvents = events.slice(0, 3);
  const popularEvents = events.slice(3);

  return (
    <div className="min-h-screen bg-[#1a1b2e] pb-[72px] lg:pb-0">
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <DesktopNav />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <Header onMenuClick={() => setIsDrawerOpen(true)} />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search events..."
              className="w-full bg-[#242538] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
            />
          </div>
          <button className="p-3 bg-[#242538] text-white rounded-xl hover:bg-[#2f3049] transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Categories</h2>
            <button className="text-[#CCFF00] hover:underline text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 min-w-max pb-4">
              {categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  icon={category.icon}
                  label={category.label}
                  primary={category.primary}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Featured Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Featured Events</h2>
            <button 
              onClick={() => navigate('/events')}
              className="flex items-center gap-1 text-[#CCFF00] hover:underline text-sm font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#CCFF00]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={(prediction) => joinEvent(event.id, prediction)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trending Groups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Trending Groups</h2>
            <button className="flex items-center gap-1 text-[#CCFF00] hover:underline text-sm font-medium">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingGroups.map((group) => (
              <GroupCard
                key={group.id}
                name={group.name}
                image={group.image}
                members={group.members}
                activeEvents={group.activeEvents}
                category={group.category}
              />
            ))}
          </div>
        </div>

        {/* Popular Events */}
        {popularEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Popular Events</h2>
              <button 
                onClick={() => navigate('/events')}
                className="flex items-center gap-1 text-[#CCFF00] hover:underline text-sm font-medium"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={(prediction) => joinEvent(event.id, prediction)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
    </div>
  );
}

export default Home;