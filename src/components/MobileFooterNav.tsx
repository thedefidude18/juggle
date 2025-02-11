import React from 'react';
import { Trophy, Gamepad2, Plus, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';

const MobileFooterNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { events } = useEvent();

  // Calculate active events count
  const activeEvents = events.filter(
    (event) =>
      new Date(event.start_time) <= new Date() &&
      new Date(event.end_time) >= new Date()
  ).length;

  // Calculate active games count (this would need to be connected to your games data)
  const activeGames = 13; // Replace with actual games count from your data

  const navItems = [
    {
      id: 'events',
      path: '/events',
      icon: <img src="/src/events-icon.png" alt="Events Icon" className="w-6 h-6" />,
      label: 'Events',
      badge: activeEvents.toString(),
    },
    {
      id: 'games',
      path: '/games',
      icon: <img src="/src/bet-active.png" alt="Events Icon" className="w-6 h-6" />,
      label: 'Challenge',
      badge: activeGames.toString(),
    },
    {
      id: 'create',
      path: '/create',
      icon: <img src="/src/create.png" alt="Events Icon" className="w-10 h-10" />,
      label: '',
      isMain: true,
    },
    {
      id: 'myevents',
      path: '/myevents',
      icon: <img src="https:/src/myevents-icon.png" alt="Events Icon" className="w-6 h-6" />,
      label: 'My Events',
    },
    {
      id: 'profile',
      path: '/profile',
      icon: <img src="/src/profile.png" alt="Events Icon" className="w-6 h-6" />,
      label: 'Profile',
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#7C3AED] safe-bottom">
    <div className="flex items-center justify-around px-1 py-0.1"> {/* Minimal padding */}
      {navItems.map((item) => (
          <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center py-3"
        >
          <div className="relative">
            {item.badge && (
              <span className="absolute -top-1 -right-2 bg-[#CCFF00] text-black text-xs font-medium rounded-full min-w-[15px] h-[15px] flex items-center justify-center">
                {item.badge}
              </span>
            )}
            <div
              className={`p-1 ${
                currentPath === item.path ? 'text-[#CCFF00]' : 'text-white/100'
              }`}
            >
              {item.icon}
            </div>
          </div>
          <span
            className={`text-xs mt-0.5 ${
              currentPath === item.path ? 'text-[#CCFF00]' : 'text-white/80'
            }`}
          >
            {item.label}
          </span>
        </button>
        ))}
      </div>
    </div>
  );
};

export default MobileFooterNav;
