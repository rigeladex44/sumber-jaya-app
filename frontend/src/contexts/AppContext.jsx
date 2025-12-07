/**
 * Application Context
 * Provides shared state and functions to all page components
 */
import React, { createContext, useContext } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children, value }) => {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
