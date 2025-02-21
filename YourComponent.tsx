import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const YourComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // Your async operations should look like this:
  const handleOperation = async () => {
    try {
      setLoading(true);
      // Your async code here
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    // Your component JSX
  );
};