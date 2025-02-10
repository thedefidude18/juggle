import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 1000 1000" className="w-full h-full">
        <path
          fill="currentColor"
          d="M500 0C776.142 0 1000 223.858 1000 500C1000 776.142 776.142 1000 500 1000C223.858 1000 0 776.142 0 500C0 223.858 223.858 0 500 0ZM500 100C279.086 100 100 279.086 100 500C100 720.914 279.086 900 500 900C720.914 900 900 720.914 900 500C900 279.086 720.914 100 500 100Z"
        />
        <path
          fill="#CCFF00"
          d="M500 600C552.843 600 600 552.843 600 500C600 447.157 552.843 400 500 400C447.157 400 400 447.157 400 500C400 552.843 447.157 600 500 600Z"
        />
      </svg>
    </div>
  );
};

export default Logo;