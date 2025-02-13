import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    // Load the Syne font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const debouncedSearch = useCallback(
    (query) => {
      const timeoutId = setTimeout(() => {
        fetchEvents(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [fetchEvents]
  );

  const handleSearch = useCallback((e) => {
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFF9E6] to-[#FFFFFF] pb-[72px] lg:pb-0">
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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center py-16">
          <h1 className="text-6xl font-bold text-[#333] font-syne">
            Control your spendings <span className="text-[#9B51E0]">Magically</span>
          </h1>
          <p className="text-lg text-[#666] mt-4">
            Manage your finances effortlessly with our intuitive tools.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-8 px-8 py-4 bg-[#9B51E0] text-white rounded-full text-lg hover:bg-[#8243c1] transition-colors shadow-lg"
          >
            Get Started
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B51E0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search events..."
              className="w-full bg-white text-gray-800 pl-12 pr-4 py-3 rounded-xl border border-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#9B51E0] transition-shadow shadow-md"
            />
          </div>
          <button className="p-3 bg-[#9B51E0] text-white rounded-xl hover:bg-[#8243c1] transition-colors shadow-md">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#333] font-syne">Categories</h2>
            <button className="text-[#9B51E0] hover:underline text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-4 min-w-max pb-4">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#333] font-syne">Featured Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-1 text-[#9B51E0] hover:underline text-sm font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#9B51E0]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#333] font-syne">Trending Groups</h2>
            <button className="flex items-center gap-1 text-[#9B51E0] hover:underline text-sm font-medium">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-[#333] font-syne">Popular Events</h2>
              <button
                onClick={() => navigate('/events')}
                className="flex items-center gap-1 text-[#9B51E0] hover:underline text-sm font-medium"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
