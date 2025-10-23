import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppSettings } from '../models/types';

export interface AppState {
  settings: AppSettings;
  isInitialized: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

type AppAction =
  | { type: 'INITIALIZE_APP'; payload: { settings: AppSettings } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } }
  | { type: 'CLEAR_NOTIFICATIONS' };

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 5000,
  transcriptionService: 'whisper',
  documentationStyle: 'soap',
  privacyMode: false,
  sessionTimeout: 30
};

const initialState: AppState = {
  settings: defaultSettings,
  isInitialized: false,
  notifications: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE_APP':
      return {
        ...state,
        settings: { ...defaultSettings, ...action.payload.settings },
        isInitialized: true
      };

    case 'UPDATE_SETTINGS':
      const updatedSettings = { ...state.settings, ...action.payload };
      // Persist settings to localStorage
      localStorage.setItem('medicalScribeSettings', JSON.stringify(updatedSettings));
      return {
        ...state,
        settings: updatedSettings
      };

    case 'ADD_NOTIFICATION':
      const notification: Notification = {
        ...action.payload,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      return {
        ...state,
        notifications: [...state.notifications, notification]
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id)
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app on mount
  React.useEffect(() => {
    const initializeApp = () => {
      try {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('medicalScribeSettings');
        const settings = savedSettings ? JSON.parse(savedSettings) : {};
        
        dispatch({ type: 'INITIALIZE_APP', payload: { settings } });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'INITIALIZE_APP', payload: { settings: defaultSettings } });
      }
    };

    initializeApp();
  }, []);

  // Auto-remove notifications
  React.useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    state.notifications.forEach(notification => {
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id: notification.id } });
        }, duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [state.notifications]);

  const updateSettings = React.useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id } });
  }, []);

  const clearNotifications = React.useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  const value: AppContextType = {
    state,
    updateSettings,
    addNotification,
    removeNotification,
    clearNotifications
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
