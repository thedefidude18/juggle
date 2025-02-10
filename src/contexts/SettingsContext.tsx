import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
    sound: boolean;
  };
  appearance: {
    darkMode: boolean;
    reducedMotion: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showActivity: boolean;
  };
  language: 'en' | 'fr' | 'es';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  toggleSetting: (category: keyof Settings, setting: string) => void;
}

const defaultSettings: Settings = {
  notifications: {
    push: true,
    email: true,
    inApp: true,
    sound: true,
  },
  appearance: {
    darkMode: false,
    reducedMotion: false,
  },
  privacy: {
    showOnlineStatus: true,
    showActivity: true,
  },
  language: 'en',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('app_settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  });

  // Apply settings effects
  useEffect(() => {
    try {
      // Save settings to localStorage
      localStorage.setItem('app_settings', JSON.stringify(settings));
      
      // Apply dark mode
      if (settings.appearance.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Apply reduced motion
      if (settings.appearance.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Initialize dark mode based on system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && !localStorage.getItem('app_settings')) {
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          darkMode: true
        }
      }));
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const toggleSetting = (category: keyof Settings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting],
      },
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};