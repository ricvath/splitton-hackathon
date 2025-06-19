import { CloudEvent, CloudBalance, CloudSettlement, UserPreferences, ExchangeRateCache } from './types';

const DB_NAME = 'SplitTON';
const DB_VERSION = 1;

const STORES = {
  EVENTS: 'events',
  BALANCES: 'balances',
  SETTLEMENTS: 'settlements',
  USER_EVENTS: 'user_events',
  PREFERENCES: 'preferences',
  EXCHANGE_RATES: 'exchange_rates',
} as const;

export class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Events store
        if (!db.objectStoreNames.contains(STORES.EVENTS)) {
          const eventsStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
          eventsStore.createIndex('createdBy', 'createdBy', { unique: false });
          eventsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Balances store
        if (!db.objectStoreNames.contains(STORES.BALANCES)) {
          const balancesStore = db.createObjectStore(STORES.BALANCES, { keyPath: 'eventId' });
        }

        // Settlements store
        if (!db.objectStoreNames.contains(STORES.SETTLEMENTS)) {
          const settlementsStore = db.createObjectStore(STORES.SETTLEMENTS, { keyPath: 'eventId' });
        }

        // User events store
        if (!db.objectStoreNames.contains(STORES.USER_EVENTS)) {
          const userEventsStore = db.createObjectStore(STORES.USER_EVENTS, { keyPath: 'userId' });
        }

        // Preferences store
        if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
          const preferencesStore = db.createObjectStore(STORES.PREFERENCES, { keyPath: 'userId' });
        }

        // Exchange rates store
        if (!db.objectStoreNames.contains(STORES.EXCHANGE_RATES)) {
          const exchangeRatesStore = db.createObjectStore(STORES.EXCHANGE_RATES, { keyPath: 'baseCurrency' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    return this.db;
  }

  // Event operations
  async saveEvent(event: CloudEvent): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.EVENTS], 'readwrite');
    const store = transaction.objectStore(STORES.EVENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...event,
        lastModified: Date.now(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEvent(eventId: string): Promise<CloudEvent | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.EVENTS], 'readonly');
    const store = transaction.objectStore(STORES.EVENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(eventId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.EVENTS, STORES.BALANCES, STORES.SETTLEMENTS], 'readwrite');
    
    const eventsStore = transaction.objectStore(STORES.EVENTS);
    const balancesStore = transaction.objectStore(STORES.BALANCES);
    const settlementsStore = transaction.objectStore(STORES.SETTLEMENTS);
    
    return new Promise((resolve, reject) => {
      eventsStore.delete(eventId);
      balancesStore.delete(eventId);
      settlementsStore.delete(eventId);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getUserEvents(userId: string): Promise<string[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.USER_EVENTS], 'readonly');
    const store = transaction.objectStore(STORES.USER_EVENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.eventIds : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveUserEvents(userId: string, eventIds: string[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.USER_EVENTS], 'readwrite');
    const store = transaction.objectStore(STORES.USER_EVENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        userId,
        eventIds,
        lastUpdated: Date.now(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Balances operations
  async saveEventBalances(eventId: string, balances: CloudBalance[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.BALANCES], 'readwrite');
    const store = transaction.objectStore(STORES.BALANCES);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        eventId,
        balances,
        lastUpdated: Date.now(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEventBalances(eventId: string): Promise<CloudBalance[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.BALANCES], 'readonly');
    const store = transaction.objectStore(STORES.BALANCES);
    
    return new Promise((resolve, reject) => {
      const request = store.get(eventId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.balances : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Settlements operations
  async saveEventSettlements(eventId: string, settlements: CloudSettlement[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.SETTLEMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.SETTLEMENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        eventId,
        settlements,
        lastUpdated: Date.now(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEventSettlements(eventId: string): Promise<CloudSettlement[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.SETTLEMENTS], 'readonly');
    const store = transaction.objectStore(STORES.SETTLEMENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(eventId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.settlements : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Preferences operations
  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PREFERENCES], 'readwrite');
    const store = transaction.objectStore(STORES.PREFERENCES);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        userId,
        ...preferences,
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PREFERENCES], 'readonly');
    const store = transaction.objectStore(STORES.PREFERENCES);
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { userId: _, ...preferences } = result;
          resolve(preferences as UserPreferences);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Exchange rates operations
  async saveExchangeRates(rates: ExchangeRateCache): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.EXCHANGE_RATES], 'readwrite');
    const store = transaction.objectStore(STORES.EXCHANGE_RATES);
    
    return new Promise((resolve, reject) => {
      const request = store.put(rates);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getExchangeRates(): Promise<ExchangeRateCache | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.EXCHANGE_RATES], 'readonly');
    const store = transaction.objectStore(STORES.EXCHANGE_RATES);
    
    return new Promise((resolve, reject) => {
      const request = store.get('TON');
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  async getAllEvents(): Promise<CloudEvent[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.EVENTS], 'readonly');
    const store = transaction.objectStore(STORES.EVENTS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PREFERENCES], 'readwrite');
    const store = transaction.objectStore(STORES.PREFERENCES);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        userId: `_system_${key}`, // Use a system prefix for non-user data
        preferences: { [key]: value },
        lastUpdated: Date.now(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getItem(key: string): Promise<string | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.PREFERENCES], 'readonly');
    const store = transaction.objectStore(STORES.PREFERENCES);
    
    return new Promise((resolve, reject) => {
      const request = store.get(`_system_${key}`);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.preferences && result.preferences[key]) {
          resolve(result.preferences[key]);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = Object.values(STORES);
    const transaction = db.transaction(storeNames, 'readwrite');
    
    return new Promise((resolve, reject) => {
      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const localDB = IndexedDBManager.getInstance(); 