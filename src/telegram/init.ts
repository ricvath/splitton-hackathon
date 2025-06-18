declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        close(): void;
        expand(): void;
        enableClosingConfirmation(): void;
        disableClosingConfirmation(): void;
        isClosingConfirmationEnabled: boolean;
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
          enable(): void;
          disable(): void;
          showProgress(leaveActive?: boolean): void;
          hideProgress(): void;
        };
        BackButton: {
          isVisible: boolean;
          onClick(callback: () => void): void;
          show(): void;
          hide(): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            allows_write_to_pm?: boolean;
            photo_url?: string;
          };
          chat?: {
            id: number;
            type: string;
            title?: string;
            username?: string;
            photo_url?: string;
          };
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        CloudStorage: {
          setItem(key: string, value: string, callback?: (error: Error | null, success?: boolean) => void): void;
          getItem(key: string, callback: (error: Error | null, value?: string) => void): void;
          getItems(keys: string[], callback: (error: Error | null, values?: Record<string, string>) => void): void;
          removeItem(key: string, callback?: (error: Error | null, success?: boolean) => void): void;
          removeItems(keys: string[], callback?: (error: Error | null, success?: boolean) => void): void;
          getKeys(callback: (error: Error | null, keys?: string[]) => void): void;
        };
        openTelegramLink(url: string): void;
        openLink(url: string, options?: { try_instant_view?: boolean }): void;
        showPopup(params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (buttonId?: string) => void): void;
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
        showScanQrPopup(params: {
          text?: string;
        }, callback?: (text: string) => boolean): void;
        closeScanQrPopup(): void;
        requestWriteAccess(callback?: (granted: boolean) => void): void;
        requestContact(callback?: (granted: boolean, contact?: {
          phone_number: string;
          first_name: string;
          last_name?: string;
          user_id?: number;
        }) => void): void;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'light' | 'dark';
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isExpanded: boolean;
        platform: string;
        version: string;
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
  photoUrl?: string;
  isPremium?: boolean;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  photoUrl?: string;
}

export interface CloudStorageData {
  [key: string]: string;
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private eventListeners: Map<string, Function[]> = new Map();
  
  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  init(): boolean {
    if (this.isAvailable()) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Enable closing confirmation for better UX
      window.Telegram.WebApp.enableClosingConfirmation();
      
      // Set up theme
      this.setupTheme();
      
      console.log('Telegram WebApp initialized:', {
        platform: window.Telegram.WebApp.platform,
        version: window.Telegram.WebApp.version,
        colorScheme: window.Telegram.WebApp.colorScheme,
      });
      
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
      photoUrl: user.photo_url,
      isPremium: false, // Would need to be determined via bot API
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
      photoUrl: chat.photo_url,
    };
  }

  getStartParam(): string | null {
    if (!this.isAvailable()) {
      return null;
    }
    return window.Telegram.WebApp.initDataUnsafe.start_param || null;
  }

  // Enhanced Cloud Storage Methods
  async setCloudData(key: string, value: any): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve(false);
        return;
      }

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      window.Telegram.WebApp.CloudStorage.setItem(key, stringValue, (error, success) => {
        if (error) {
          console.error('Failed to set cloud data:', error);
          resolve(false);
        } else {
          resolve(success || true);
        }
      });
    });
  }

  async getCloudData(key: string): Promise<any | null> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve(null);
        return;
      }

      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          try {
            // Try to parse as JSON, fallback to string
            resolve(JSON.parse(value));
          } catch {
            resolve(value);
          }
        }
      });
    });
  }

  async getMultipleCloudData(keys: string[]): Promise<CloudStorageData> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve({});
        return;
      }

      window.Telegram.WebApp.CloudStorage.getItems(keys, (error, values) => {
        if (error || !values) {
          resolve({});
        } else {
          // Parse JSON values where possible
          const parsedValues: CloudStorageData = {};
          Object.entries(values).forEach(([key, value]) => {
            try {
              parsedValues[key] = JSON.parse(value);
            } catch {
              parsedValues[key] = value;
            }
          });
          resolve(parsedValues);
        }
      });
    });
  }

  async removeCloudData(key: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve(false);
        return;
      }

      window.Telegram.WebApp.CloudStorage.removeItem(key, (error, success) => {
        if (error) {
          console.error('Failed to remove cloud data:', error);
          resolve(false);
        } else {
          resolve(success || true);
        }
      });
    });
  }

  async getAllCloudKeys(): Promise<string[]> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve([]);
        return;
      }

      window.Telegram.WebApp.CloudStorage.getKeys((error, keys) => {
        if (error || !keys) {
          resolve([]);
        } else {
          resolve(keys);
        }
      });
    });
  }

  // Enhanced Sharing Methods
  shareEvent(eventId: string, eventName: string, description?: string): void {
    if (!this.isAvailable()) {
      console.warn('Telegram WebApp not available');
      return;
    }

    const botUsername = 'splitton_bot'; // Your bot username
    const shareUrl = `https://t.me/${botUsername}/app?startapp=${eventId}`;
    const shareText = description || `Join "${eventName}" - Split expenses easily with SplitTON!`;
    
    window.Telegram.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    );
  }

  shareToChat(eventId: string, eventName: string): void {
    if (!this.isAvailable()) {
      console.warn('Telegram WebApp not available');
      return;
    }

    const botUsername = 'splitton_bot';
    const shareUrl = `https://t.me/${botUsername}/app?startapp=${eventId}`;
    
    window.Telegram.WebApp.openTelegramLink(shareUrl);
  }

  // UI Enhancement Methods
  showMainButton(text: string, onClick: () => void): void {
    if (!this.isAvailable()) return;

    const mainButton = window.Telegram.WebApp.MainButton;
    mainButton.setText(text);
    mainButton.onClick(onClick);
    mainButton.show();
    mainButton.enable();
  }

  hideMainButton(): void {
    if (!this.isAvailable()) return;
    window.Telegram.WebApp.MainButton.hide();
  }

  showBackButton(onClick: () => void): void {
    if (!this.isAvailable()) return;

    const backButton = window.Telegram.WebApp.BackButton;
    backButton.onClick(onClick);
    backButton.show();
  }

  hideBackButton(): void {
    if (!this.isAvailable()) return;
    window.Telegram.WebApp.BackButton.hide();
  }

  // Haptic Feedback
  hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string): void {
    if (!this.isAvailable()) return;

    const haptic = window.Telegram.WebApp.HapticFeedback;
    
    switch (type) {
      case 'impact':
        haptic.impactOccurred(style as any || 'medium');
        break;
      case 'notification':
        haptic.notificationOccurred(style as any || 'success');
        break;
      case 'selection':
        haptic.selectionChanged();
        break;
    }
  }

  // Theme and UI
  private setupTheme(): void {
    if (!this.isAvailable()) return;

    const themeParams = window.Telegram.WebApp.themeParams;
    const root = document.documentElement;

    // Apply Telegram theme colors to CSS variables
    if (themeParams.bg_color) {
      root.style.setProperty('--tg-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
      root.style.setProperty('--tg-text-color', themeParams.text_color);
    }
    if (themeParams.button_color) {
      root.style.setProperty('--tg-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
      root.style.setProperty('--tg-button-text-color', themeParams.button_text_color);
    }
  }

  getTheme(): 'light' | 'dark' {
    if (!this.isAvailable()) return 'light';
    return window.Telegram.WebApp.colorScheme;
  }

  // Utility Methods
  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        alert(message);
        resolve();
        return;
      }

      window.Telegram.WebApp.showAlert(message, () => {
        resolve();
      });
    });
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve(confirm(message));
        return;
      }

      window.Telegram.WebApp.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    });
  }

  openExternalLink(url: string): void {
    if (!this.isAvailable()) {
      window.open(url, '_blank');
      return;
    }

    window.Telegram.WebApp.openLink(url, { try_instant_view: true });
  }

  close(): void {
    if (this.isAvailable()) {
      window.Telegram.WebApp.close();
    }
  }

  // Event System
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export const telegramWebApp = TelegramWebApp.getInstance(); 