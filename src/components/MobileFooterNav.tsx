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
      icon: <Trophy className="w-6 h-6" />,
      label: 'Events',
      badge: activeEvents.toString(),
    },
    {
      id: 'games',
      path: '/games',
      icon: <Gamepad2 className="w-6 h-6" />,
      label: 'Challenge',
      badge: activeGames.toString(),
    },
    {
      id: 'create',
      path: '/create',
      icon: <Plus className="w-7 h-7" />,
      label: 'Create',
      isMain: true,
    },
    {
      id: 'myevents',
      path: '/myevents',
      icon: <Trophy className="w-6 h-6" />,
      label: 'MyEvents',
    },
    {
      id: 'profile',
      path: '/profile',
      icon: <User className="w-6 h-6" />,
      label: 'Profile',
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#7C3AED] safe-bottom">
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center ${
              item.isMain ? '-mt-6 mb-2' : 'py-3'
            }`}
          >
            {item.isMain ? (
              <div className="w-14 h-14 bg-[#CCFF00] rounded-full flex items-center justify-center shadow-lg">
                {item.icon}
              </div>
            ) : (
              <div className="relative">
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-[#CCFF00] text-black text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <div
                  className={`p-1 ${
                    currentPath === item.path
                      ? 'text-[#CCFF00]'
                      : 'text-white/80'
                  }`}
                >
                  {item.icon}
                </div>
              </div>
            )}
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
