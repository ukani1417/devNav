import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { StorageManager } from '@/core/storage';
import type { DevNavigatorConfig, Token } from '@/types';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface AppContextType {
  config: DevNavigatorConfig | null;
  tokens: Record<string, Token>;
  loading: boolean;
  message: Message | null;
  addToken: (key: string, value: string) => Promise<void>;
  removeToken: (key: string) => Promise<void>;
  exportConfig: () => Promise<void>;
  importConfig: (file: File) => Promise<void>;
  clearAll: () => Promise<void>;
  setMessage: (message: Message | null) => void;
}

type AppAction =
  | { type: 'SET_CONFIG'; config: DevNavigatorConfig }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_MESSAGE'; message: Message | null };

interface AppState {
  config: DevNavigatorConfig | null;
  loading: boolean;
  message: Message | null;
}

const initialState: AppState = {
  config: null,
  loading: true,
  message: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.config, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_MESSAGE':
      return { ...state, message: action.message };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const storageRef = React.useRef(new StorageManager());

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await storageRef.current.getConfig();
        dispatch({ type: 'SET_CONFIG', config });
      } catch (error) {
        console.error('Failed to load config:', error);
        dispatch({
          type: 'SET_MESSAGE',
          message: { type: 'error', text: 'Failed to load configuration' },
        });
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    // Auto-clear messages after 3 seconds
    if (state.message) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_MESSAGE', message: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.message]);

  const addToken = async (key: string, value: string) => {
    try {
      await storageRef.current.setToken(key, value);
      const config = await storageRef.current.getConfig();
      dispatch({ type: 'SET_CONFIG', config });
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'success', text: `Token '${key}' added successfully` },
      });
    } catch (error) {
      console.error('Failed to add token:', error);
      dispatch({ type: 'SET_MESSAGE', message: { type: 'error', text: 'Failed to add token' } });
    }
  };

  const removeToken = async (key: string) => {
    try {
      await storageRef.current.removeToken(key);
      const config = await storageRef.current.getConfig();
      dispatch({ type: 'SET_CONFIG', config });
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'success', text: `Token '${key}' removed successfully` },
      });
    } catch (error) {
      console.error('Failed to remove token:', error);
      dispatch({ type: 'SET_MESSAGE', message: { type: 'error', text: 'Failed to remove token' } });
    }
  };

  const exportConfig = async () => {
    try {
      const configExport = await storageRef.current.exportConfig();
      const dataStr = JSON.stringify(configExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dev-navigator-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'success', text: 'Configuration exported successfully' },
      });
    } catch (error) {
      console.error('Failed to export config:', error);
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'error', text: 'Failed to export configuration' },
      });
    }
  };

  const importConfig = async (file: File) => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      await storageRef.current.importConfig(importData);
      const config = await storageRef.current.getConfig();
      dispatch({ type: 'SET_CONFIG', config });
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'success', text: 'Configuration imported successfully' },
      });
    } catch (error) {
      console.error('Failed to import config:', error);
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'error', text: 'Failed to import configuration' },
      });
    }
  };

  const clearAll = async () => {
    try {
      await storageRef.current.resetConfig();
      const config = await storageRef.current.getConfig();
      dispatch({ type: 'SET_CONFIG', config });
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'success', text: 'All shortcuts cleared successfully' },
      });
    } catch (error) {
      console.error('Failed to clear config:', error);
      dispatch({
        type: 'SET_MESSAGE',
        message: { type: 'error', text: 'Failed to clear configuration' },
      });
    }
  };

  const setMessage = (message: Message | null) => {
    dispatch({ type: 'SET_MESSAGE', message });
  };

  const value: AppContextType = {
    config: state.config,
    tokens: state.config?.tokens || {},
    loading: state.loading,
    message: state.message,
    addToken,
    removeToken,
    exportConfig,
    importConfig,
    clearAll,
    setMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
