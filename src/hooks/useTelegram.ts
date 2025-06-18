import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
    hint_color: string;
    bg_color: string;
    text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Mock user for local testing
const MOCK_USER: TelegramUser = {
  id: 12345678,
  first_name: "Demo",
  last_name: "User",
  username: "demo_user",
  language_code: "en"
};

// Bot information
const BOT_USERNAME = 'splitton_bot';
const BOT_NAME = 'SplitTON';

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Real Telegram Web App is available
      tg.ready();
      setWebApp(tg);
      setUser(tg.initDataUnsafe.user || null);
      setIsReady(true);
      
      // Set Telegram theme
      if (tg.themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color);
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color);
      }
      
      // Expand the app to full height
      tg.expand();
      
      console.log('Telegram WebApp initialized:', { 
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme,
        viewportHeight: tg.viewportHeight
      });
    } else {
      // No Telegram Web App - we're in browser mode for local testing
      console.log('Running in browser mode (no Telegram Web App detected)');
      setUser(MOCK_USER);
      setIsReady(true);
    }
  }, []);

  const shareApp = () => {
    const shareText = `Split expenses easily with ${BOT_NAME}! 💰⚡`;
    const shareUrl = `https://t.me/${BOT_USERNAME}`;
    
    if (webApp) {
      // Use Telegram's native sharing if available
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    } else {
      // Fallback to web sharing
      if (navigator.share) {
        navigator.share({
          title: BOT_NAME,
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Copy to clipboard as fallback
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('Link copied to clipboard!');
      }
    }
  };

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (webApp?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        webApp.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
      } else {
        webApp.HapticFeedback.impactOccurred(type);
      }
    }
    // No haptic feedback in browser mode - silent fallback
  };

  return {
    user,
    webApp,
    shareApp,
    showMainButton,
    hideMainButton,
    hapticFeedback,
    isInTelegram: !!webApp,
    colorScheme: webApp?.colorScheme || 'light',
    isReady,
    botUsername: BOT_USERNAME,
    botName: BOT_NAME
  };
}; 