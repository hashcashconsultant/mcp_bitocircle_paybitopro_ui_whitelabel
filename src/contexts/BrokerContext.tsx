// app/contexts/BrokerContext.tsx
'use client'; // Add this line at the very top

import React, { createContext, useState, useContext, ReactNode } from 'react';


// Define the shape of broker details
export interface BrokerDetails {
  companyName: string;
  referralCode: string;
  profilePicUrl?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  brokerId?: string;
  // Add any other fields as necessary
  [key: string]: unknown;
}

// Define the context type
interface BrokerContextType {
  brokerDetails: BrokerDetails | null;
  updateBrokerDetails: (data: BrokerDetails) => void;
}

// Create the Context with proper typing
export const BrokerContext = createContext<BrokerContextType | null>(null);

// Define props for the Provider
interface BrokerProviderProps {
  children: ReactNode;
}

// Create a Provider component
export const BrokerProvider: React.FC<BrokerProviderProps> = ({ children }) => {
  const [brokerDetails, setBrokerDetails] = useState<BrokerDetails | null>(null);

  const updateBrokerDetails = (data: BrokerDetails) => {
    setBrokerDetails(data);
    console.log('data', data);
    localStorage.setItem('brokerCompanyName', data.companyName);
    localStorage.setItem('brokerReferral', data.referralCode);

    const link = `https://www.paybito.com/crypto-broker-signup/?referral_code=${data.referralCode}`;
    localStorage.setItem('footerTwitterLink', link);
  };

  return (
    <BrokerContext.Provider value={{ brokerDetails, updateBrokerDetails }}>
      {children}
    </BrokerContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useBroker = (): BrokerContextType => {
  const context = useContext(BrokerContext);
  if (!context) {
    throw new Error('useBroker must be used within a BrokerProvider');
  }
  return context;
};