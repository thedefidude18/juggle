import React from 'react';

interface CategoryButtonProps {
  icon: React.ReactNode | string;
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ 
  icon, 
  label, 
  primary,
  onClick 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] p-2 rounded-xl ${
        primary ? 'bg-[#CCFF00]' : 'bg-[#2A2B3F]'
      } hover:scale-105 transition-transform cursor-pointer`}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-1 ${
        primary ? 'bg-[#CCFF00]' : 'bg-[#242538]'
      }`}>
        {typeof icon === 'string' ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <div className={primary ? 'text-black' : 'text-white'}>
            {icon}
          </div>
        )}
      </div>
      <span className={`text-xs sm:text-sm whitespace-nowrap ${
        primary ? 'text-black' : 'text-white'
      }`}>{label}</span>
    </button>
  );
}

export default CategoryButton;