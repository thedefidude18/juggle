import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight } from 'lucide-react';
import EventCard from '../components/EventCard';
import CategoryButton from '../components/CategoryButton';
import MobileFooterNav from '../components/MobileFooterNav';
import Header from '../components/Header';
import { useEvent } from '../hooks/useEvent';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { events, loading, joinEvent, fetchEvents } = useEvent();
  const toast = useToast();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Move all hooks above any other logic
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

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

  // Filter events for different sections
  const featuredEvents = events?.filter(event => 
    new Date(event.start_time) > new Date()
  ) || [];

  const popularEvents = events?.filter(event => 
    event.participants?.length > 5
  ) || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Rest of your JSX */}
      <MobileFooterNav />
    </div>
  );
}

export default Home;
