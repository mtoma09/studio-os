'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextValue {
  studioName: string;
  setStudioName: (name: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  studioName: 'Design Studio HQ',
  setStudioName: () => {},
  userName: 'Ellie',
  setUserName: () => {},
  email: 'ellie@studio.com',
  setEmail: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [studioName, setStudioName] = useState('Design Studio HQ');
  const [userName, setUserName] = useState('Ellie');
  const [email, setEmail] = useState('ellie@studio.com');

  return (
    <SettingsContext.Provider value={{ studioName, setStudioName, userName, setUserName, email, setEmail }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
