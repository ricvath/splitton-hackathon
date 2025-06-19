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

  // Utility methods for internal use
  private async getItem(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          resolve(value);
        }
      });
    });
  }

  private async setItem(key: string, value: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, value, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async removeItem(key: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Telegram Cloud Storage not available');
    }

    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.removeItem(key, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // User Event List Management
  async getUserEvents(userId: string): Promise<CloudEvent[]> {
    try {
      console.log('[CloudStorage] Getting events for user:', userId);
      
      // Get list of event IDs for this user
      const eventIdsKey = `user_events_${userId}`;
      const eventIds = await this.getItem(eventIdsKey);
      
      if (!eventIds) {
        console.log('[CloudStorage] No events found for user');
        return [];
      }
      
      let eventIdList: string[] = [];
      try {
        const parsed = JSON.parse(eventIds);
        if (Array.isArray(parsed)) {
          eventIdList = parsed;
        } else {
          console.warn('[CloudStorage] Event IDs is not an array, returning empty list');
          return [];
        }
      } catch (parseError) {
        console.error('[CloudStorage] Error parsing event IDs:', parseError);
        return [];
      }
      
      const events: CloudEvent[] = [];
      
      // Fetch each event
      for (const eventId of eventIdList) {
        try {
          const event = await this.getEvent(eventId);
          if (event && event.isActive) {
            // Only include events where user is still an active participant
            const isParticipant = event.participants.some(
              p => p.telegramId === userId && p.isActive
            );
            if (isParticipant || event.createdBy === userId) {
              events.push(event);
            }
          }
        } catch (error) {
          console.warn(`[CloudStorage] Failed to fetch event ${eventId}:`, error);
        }
      }
      
      // Sort by last modified (newest first)
      return events.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error('[CloudStorage] Error getting user events:', error);
      throw error;
    }
  }

  async addUserToEvent(userId: string, eventId: string): Promise<void> {
    try {
      console.log('[CloudStorage] Adding user to event:', { userId, eventId });
      
      const eventIdsKey = `user_events_${userId}`;
      const existingIds = await this.getItem(eventIdsKey);
      
      let eventIds: string[] = [];
      if (existingIds) {
        try {
          const parsed = JSON.parse(existingIds);
          // Ensure parsed data is an array
          if (Array.isArray(parsed)) {
            eventIds = parsed;
          } else {
            console.warn('[CloudStorage] Event IDs is not an array, initializing as empty array');
            eventIds = [];
          }
        } catch (parseError) {
          console.error('[CloudStorage] Error parsing event IDs, initializing as empty array:', parseError);
          eventIds = [];
        }
      }
      
      // Add event ID if not already present
      if (!eventIds.includes(eventId)) {
        eventIds.push(eventId);
        await this.setItem(eventIdsKey, JSON.stringify(eventIds));
      }
    } catch (error) {
      console.error('[CloudStorage] Error adding user to event:', error);
      throw error;
    }
  }

  async removeUserFromEvent(userId: string, eventId: string): Promise<void> {
    try {
      console.log('[CloudStorage] Removing user from event:', { userId, eventId });
      
      const eventIdsKey = `user_events_${userId}`;
      const existingIds = await this.getItem(eventIdsKey);
      
      if (existingIds) {
        try {
          let eventIds = JSON.parse(existingIds);
          
          // Ensure eventIds is an array
          if (!Array.isArray(eventIds)) {
            console.warn('[CloudStorage] Event IDs is not an array, initializing as empty array');
            eventIds = [];
          }
          
          // Filter out the event ID
          eventIds = eventIds.filter(id => id !== eventId);
          await this.setItem(eventIdsKey, JSON.stringify(eventIds));
        } catch (parseError) {
          console.error('[CloudStorage] Error parsing event IDs, initializing as empty array:', parseError);
          // If parsing fails, just remove the corrupted data
          await this.setItem(eventIdsKey, JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error('[CloudStorage] Error removing user from event:', error);
      throw error;
    }
  }

  async canDeleteEvent(eventId: string, userId: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const event = await this.getEvent(eventId);
      
      if (!event) {
        return { canDelete: false, reason: 'Event not found' };
      }
      
      // Only the creator can delete the event
      if (event.createdBy !== userId) {
        return { canDelete: false, reason: 'Only the event creator can delete this event' };
      }
      
      // Check if there are any expenses
      if (event.expenses.length === 0) {
        return { canDelete: true };
      }
      
      // Check if all expenses are settled
      // Calculate balances to see if anyone owes money
      const participantNames = event.participants
        .filter(p => p.isActive)
        .map(p => p.telegramId);
      
      const expenses = event.expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paidBy,
        sharedBy: expense.sharedBy,
        date: new Date(expense.createdAt)
      }));
      
      // Import the balance calculation function
      const { calculateBalances } = await import('../utils/expenseCalculator');
      const balances = calculateBalances(expenses, participantNames);
      
      // Check if all balances are zero (settled)
      const hasOutstandingBalances = Object.values(balances).some(balance => Math.abs(balance) > 0.01);
      
      if (hasOutstandingBalances) {
        return { canDelete: false, reason: 'Cannot delete event with outstanding balances. All expenses must be settled first.' };
      }
      
      return { canDelete: true };
    } catch (error) {
      console.error('[CloudStorage] Error checking if event can be deleted:', error);
      return { canDelete: false, reason: 'Error checking event status' };
    }
  }

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      // First check if deletion is allowed
      const { canDelete, reason } = await this.canDeleteEvent(eventId, userId);
      
      if (!canDelete) {
        throw new Error(reason || 'Cannot delete event');
      }
      
      console.log('[CloudStorage] Deleting event:', eventId);
      
      // Get the event to remove all participants from their event lists
      const event = await this.getEvent(eventId);
      if (event) {
        // Remove event from all participants' event lists
        for (const participant of event.participants) {
          await this.removeUserFromEvent(participant.telegramId, eventId);
        }
        
        // Remove the creator from the event list too
        await this.removeUserFromEvent(event.createdBy, eventId);
      }
      
      // Delete the event and related data
      const eventKey = STORAGE_KEYS.EVENT(eventId);
      const balancesKey = STORAGE_KEYS.EVENT_BALANCES(eventId);
      const settlementsKey = STORAGE_KEYS.EVENT_SETTLEMENTS(eventId);
      
      await Promise.all([
        this.removeItem(eventKey),
        this.removeItem(balancesKey).catch(() => {}), // Ignore errors for optional data
        this.removeItem(settlementsKey).catch(() => {}), // Ignore errors for optional data
      ]);
      
      console.log('[CloudStorage] Event deleted successfully');
    } catch (error) {
      console.error('[CloudStorage] Error deleting event:', error);
      throw error;
    }
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