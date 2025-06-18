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
        const initialized = telegramWebApp.init();
        
        if (initialized) {
          setTelegramData({
            user: telegramWebApp.getUser(),
            chat: telegramWebApp.getChat(),
            startParam: telegramWebApp.getStartParam(),
            isAvailable: true,
            isReady: true,
          });
          return true; // Successfully initialized
        } else {
          setTelegramData(prev => ({
            ...prev,
            isAvailable: true,
            isReady: false,
          }));
        }
      } else {
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
        return true; // Ready for development
      }
      return false;
    };

    // Try to initialize immediately
    const success = initTelegram();
    
    // If not successful and we're in a Telegram environment, try once more after a brief delay
    if (!success && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      const timeoutId = setTimeout(() => {
        initTelegram();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const shareEvent = (eventId: string, eventName: string) => {
    telegramWebApp.shareEvent(eventId, eventName);
  };

  const closeTelegram = () => {
    telegramWebApp.close();
  };

  return {
    ...telegramData,
    shareEvent,
    closeTelegram,
  };
}; 