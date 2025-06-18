import { useState, useEffect } from 'react';
import { telegramWebApp, TelegramUser, TelegramChat } from '../telegram/init';

export interface TelegramData {
  user: TelegramUser | null;
  chat: TelegramChat | null;
  startParam: string | null;
  isAvailable: boolean;
  isReady: boolean;
}

export const useTelegramData = () => {
  const [telegramData, setTelegramData] = useState<TelegramData>({
    user: null,
    chat: null,
    startParam: null,
    isAvailable: false,
    isReady: false,
  });

  useEffect(() => {
    const initTelegram = () => {
      const isAvailable = telegramWebApp.isAvailable();
      
      if (isAvailable) {
        console.log('Telegram WebApp is available, initializing...');
        
        try {
          const initialized = telegramWebApp.init();
          
          if (initialized) {
            console.log('Telegram WebApp initialized successfully');
            
            setTelegramData({
              user: telegramWebApp.getUser(),
              chat: telegramWebApp.getChat(),
              startParam: telegramWebApp.getStartParam(),
              isAvailable: true,
              isReady: true,
            });
            return true;
          } else {
            console.warn('Telegram WebApp initialization returned false');
            
            // Even if init returns false, we can still try to get data
            setTelegramData({
              user: telegramWebApp.getUser(),
              chat: telegramWebApp.getChat(),
              startParam: telegramWebApp.getStartParam(),
              isAvailable: true,
              isReady: true, // Set ready to true anyway
            });
            return true;
          }
        } catch (error) {
          console.error('Error during Telegram WebApp initialization:', error);
          
          // Set ready to true even on error to avoid infinite loading
          setTelegramData(prev => ({
            ...prev,
            isAvailable: true,
            isReady: true,
          }));
          return true;
        }
      } else {
        console.log('Telegram WebApp not available, using development mode');
        
        // For development/testing outside Telegram
        setTelegramData({
          user: {
            id: 123456789,
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            languageCode: 'en',
          },
          chat: null,
          startParam: null,
          isAvailable: false,
          isReady: true,
        });
        return true;
      }
    };

    // Try to initialize immediately
    const success = initTelegram();
    
    // If not successful, set a timeout to ensure we don't get stuck
    if (!success) {
      const timeoutId = setTimeout(() => {
        console.log('Timeout reached, forcing ready state');
        setTelegramData(prev => ({
          ...prev,
          isReady: true,
        }));
      }, 3000); // 3 second timeout

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const shareEvent = (eventId: string, eventName: string) => {
    try {
      telegramWebApp.shareEvent(eventId, eventName);
    } catch (error) {
      console.error('Failed to share event:', error);
    }
  };

  const closeTelegram = () => {
    try {
      telegramWebApp.close();
    } catch (error) {
      console.error('Failed to close Telegram:', error);
    }
  };

  return {
    ...telegramData,
    shareEvent,
    closeTelegram,
  };
}; 