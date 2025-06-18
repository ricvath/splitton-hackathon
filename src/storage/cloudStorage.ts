import { telegramWebApp } from '../telegram/init';
import {
  CloudEvent,
  CloudParticipant,
  CloudExpense,
  CloudBalance,
  CloudSettlement,
  UserEventList,
  EventInvitation,
  UserPreferences,
  ExchangeRateCache,
  STORAGE_KEYS,
} from './types';

export class CloudStorageManager {
  private static instance: CloudStorageManager;

  static getInstance(): CloudStorageManager {
    if (!CloudStorageManager.instance) {
      CloudStorageManager.instance = new CloudStorageManager();
    }
    return CloudStorageManager.instance;
  }

  private isAvailable(): boolean {
    return telegramWebApp.isAvailable() && !!window.Telegram?.WebApp?.CloudStorage;
  }

  // Event Management
  async saveEvent(event: CloudEvent): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const key = STORAGE_KEYS.EVENT(event.id);
    const data = JSON.stringify({
      ...event,
      lastModified: Date.now(),
    });

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getEvent(eventId: string): Promise<CloudEvent | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const key = STORAGE_KEYS.EVENT(eventId);

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve(null);
          }
        }
      });
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const keys = [
      STORAGE_KEYS.EVENT(eventId),
      STORAGE_KEYS.EVENT_BALANCES(eventId),
      STORAGE_KEYS.EVENT_SETTLEMENTS(eventId),
    ];

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.removeItems(keys, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // User Event List Management
  async getUserEvents(userId: string): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const key = STORAGE_KEYS.USER_EVENTS(userId);

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve([]);
        } else {
          try {
            const userEventList: UserEventList = JSON.parse(value);
            resolve(userEventList.eventIds);
          } catch {
            resolve([]);
          }
        }
      });
    });
  }

  async addUserEvent(userId: string, eventId: string): Promise<void> {
    const currentEvents = await this.getUserEvents(userId);
    
    if (!currentEvents.includes(eventId)) {
      currentEvents.push(eventId);
      
      const userEventList: UserEventList = {
        userId,
        eventIds: currentEvents,
        lastUpdated: Date.now(),
      };

      const key = STORAGE_KEYS.USER_EVENTS(userId);
      const data = JSON.stringify(userEventList);

      return new Promise((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }

  async removeUserEvent(userId: string, eventId: string): Promise<void> {
    const currentEvents = await this.getUserEvents(userId);
    const filteredEvents = currentEvents.filter(id => id !== eventId);
    
    const userEventList: UserEventList = {
      userId,
      eventIds: filteredEvents,
      lastUpdated: Date.now(),
    };

    const key = STORAGE_KEYS.USER_EVENTS(userId);
    const data = JSON.stringify(userEventList);

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Balance Management
  async saveEventBalances(eventId: string, balances: CloudBalance[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const key = STORAGE_KEYS.EVENT_BALANCES(eventId);
    const data = JSON.stringify(balances);

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getEventBalances(eventId: string): Promise<CloudBalance[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const key = STORAGE_KEYS.EVENT_BALANCES(eventId);

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve([]);
        } else {
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve([]);
          }
        }
      });
    });
  }

  // Settlement Management
  async saveEventSettlements(eventId: string, settlements: CloudSettlement[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const key = STORAGE_KEYS.EVENT_SETTLEMENTS(eventId);
    const data = JSON.stringify(settlements);

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getEventSettlements(eventId: string): Promise<CloudSettlement[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const key = STORAGE_KEYS.EVENT_SETTLEMENTS(eventId);

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve([]);
        } else {
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve([]);
          }
        }
      });
    });
  }

  // User Preferences
  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const key = STORAGE_KEYS.USER_PROFILE(userId);
    const data = JSON.stringify(preferences);

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const key = STORAGE_KEYS.USER_PROFILE(userId);

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve(null);
          }
        }
      });
    });
  }

  // Exchange Rate Cache
  async saveExchangeRates(rates: ExchangeRateCache): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const key = 'exchange_rates';
    const data = JSON.stringify(rates);

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async getExchangeRates(): Promise<ExchangeRateCache | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const key = 'exchange_rates';

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve(null);
          }
        }
      });
    });
  }

  // Utility methods
  async getAllKeys(): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getKeys((error, keys) => {
        if (error || !keys) {
          resolve([]);
        } else {
          resolve(keys);
        }
      });
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    const keys = await this.getAllKeys();
    
    if (keys.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.removeItems(keys, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

export const cloudStorage = CloudStorageManager.getInstance(); 