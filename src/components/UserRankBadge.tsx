import React from 'react';
import { Trophy } from 'lucide-react';

interface UserRankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

const UserRankBadge: React.FC<UserRankBadgeProps> = ({ rank, size = 'sm' }) => {
  const getColor = () => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-700';
    return 'bg-[#7C3AED]';
  };

  const sizeClasses = {
    sm: 'h-5 text-xs',
    md: 'h-6 text-sm',
    lg: 'h-8 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 ${sizeClasses[size]} ${getColor()} text-white rounded-full font-medium`}>
      <Trophy className={iconSizes[size]} />
      <span>#{rank}</span>
    </div>
  );
};

export default UserRankBadge;