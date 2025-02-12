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
  className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] p-2 relative cursor-pointer"
>
<div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center relative">
    
      {typeof icon === 'string' ? (
        <span className="text-3xl text-white">{icon}</span>
      ) : (
        <div className="text-white">{icon}</div>
      )}
    </div>
</button>

  );
}

export default CategoryButton;