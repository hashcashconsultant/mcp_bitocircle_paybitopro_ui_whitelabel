'use client'; // Add this line at the very top

import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface MetaMaskAccount {
    account : string,
}

// Define the context type
interface MetamaskContextType  {
  metaMask : MetaMaskAccount | null;
  setMetaMask: (value: MetaMaskAccount | null) => void;
};

// Create the Context with proper typing
export const MetaMaskContext = createContext<MetamaskContextType | null>(null);

// Define props for the Provider
interface MetaMaskProviderProps {
  children: ReactNode;
}

// Create a Provider component
export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  const [metaMask, setMetaMask] = useState<MetaMaskAccount | null>(null);

 

  return (
    <MetaMaskContext.Provider value={{ metaMask, setMetaMask  }}>
      {children}
    </MetaMaskContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useMetaMask = (): MetamaskContextType => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
};