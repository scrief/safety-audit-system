import { useState, useCallback } from 'react';

interface Settings {
  companyName: string;
  logo: string | null;
  defaultEmailDomain: string;
  notificationEmail: string;
  theme: 'light' | 'dark' | 'system';
}

export const useSettings = () => {
  const STORAGE_KEY = 'app_settings';

  const saveSettings = useCallback(async (settings: Settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      return savedSettings ? JSON.parse(savedSettings) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }, []);

  return { saveSettings, loadSettings };
};

export default useSettings; 