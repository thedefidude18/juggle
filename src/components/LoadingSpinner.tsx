import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = '#CCFF00'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-t-2 ${sizeClasses[size]}`} 
      style={{ 
        borderColor: `${color}33`,
        borderTopColor: color
      }} 
    />
  );
};

export default LoadingSpinner;