declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        close(): void;
        expand(): void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText(text: string): void;
          onClick(callback: () => void): void;
          show(): void;
          hide(): void;
        };
        initDataUnsafe: {
          user?: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            allows_write_to_pm?: boolean;
          };
          chat?: {
            id: number;
            type: string;
            title?: string;
            username?: string;
          };
          start_param?: string;
        };
        CloudStorage: {
          setItem(key: string, value: string, callback?: (error: Error | null) => void): void;
          getItem(key: string, callback: (error: Error | null, value?: string) => void): void;
          getItems(keys: string[], callback: (error: Error | null, values?: Record<string, string>) => void): void;
          removeItem(key: string, callback?: (error: Error | null) => void): void;
          removeItems(keys: string[], callback?: (error: Error | null) => void): void;
          getKeys(callback: (error: Error | null, keys?: string[]) => void): void;
        };
        openTelegramLink(url: string): void;
        openLink(url: string): void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private initialized = false;
  
  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  init(): boolean {
    if (this.initialized) {
      return true; // Already initialized
    }

    if (this.isAvailable()) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      this.initialized = true;
      return true;
    }
    return false;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  }

  getUser(): TelegramUser | null {
    if (!this.isAvailable() || !window.Telegram.WebApp.initDataUnsafe.user) {
      return null;
    }

    const user = window.Telegram.WebApp.initDataUnsafe.user;
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
    };
  }

  getChat(): TelegramChat | null {
    if (!this.isAvailable() || !window.Telegram.WebApp.initDataUnsafe.chat) {
      return null;
    }

    const chat = window.Telegram.WebApp.initDataUnsafe.chat;
    return {
      id: chat.id,
      type: chat.type,
      title: chat.title,
      username: chat.username,
    };
  }

  getStartParam(): string | null {
    if (!this.isAvailable()) {
      return null;
    }
    return window.Telegram.WebApp.initDataUnsafe.start_param || null;
  }

  shareEvent(eventId: string, eventName: string): void {
    if (!this.isAvailable()) {
      console.warn('Telegram WebApp not available');
      return;
    }

    const shareUrl = `https://t.me/splitton_bot/app?startapp=${eventId}`;
    const shareText = `Join my expense splitting event: ${eventName}`;
    
    window.Telegram.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    );
  }

  close(): void {
    if (this.isAvailable()) {
      window.Telegram.WebApp.close();
    }
  }
}

export const telegramWebApp = TelegramWebApp.getInstance(); 