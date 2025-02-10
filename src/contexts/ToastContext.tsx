import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, toast as toastify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showSuccess = useCallback((message: string) => {
    toastify.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'dark',
      style: {
        background: '#242538',
        color: '#CCFF00'
      }
    });
  }, []);

  const showError = useCallback((message: string) => {
    toastify.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'dark',
      style: {
        background: '#242538',
        color: '#FF4B4B'
      }
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    toastify.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'dark',
      style: {
        background: '#242538',
        color: '#ffffff'
      }
    });
  }, []);

  const showWarning = useCallback((message: string) => {
    toastify.warning(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'dark',
      style: {
        background: '#242538',
        color: '#FFB800'
      }
    });
  }, []);

  return (
    <ToastContext.Provider value={{
      showSuccess,
      showError,
      showInfo,
      showWarning
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};