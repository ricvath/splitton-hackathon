import { CloudEvent, CloudExpense, CloudParticipant } from './types';
import { CloudStorageManager } from './cloudStorage';
import { IndexedDBManager } from './indexedDB';

export interface SyncConflict {
  type: 'expense_conflict' | 'participant_conflict' | 'event_metadata_conflict';
  localData: any;
  remoteData: any;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  conflicts: SyncConflict[];
}

export class DataSyncManager {
  private cloudStorage: CloudStorageManager;
  private localDB: IndexedDBManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private readonly CONFLICT_RESOLUTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cloudStorage = CloudStorageManager.getInstance();
    this.localDB = IndexedDBManager.getInstance();
    this.initializeSync();
  }

  private initializeSync() {
    // Start periodic sync
    this.startPeriodicSync();

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));

    // Listen for Telegram WebApp visibility changes
    if (window.Telegram?.WebApp) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.triggerSync();
        }
      });
    }
  }

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, this.SYNC_INTERVAL_MS);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private handleOnlineStatus(isOnline: boolean) {
    console.log(`[DataSync] Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // Trigger immediate sync when coming back online
      this.triggerSync();
      this.startPeriodicSync();
    } else {
      // Stop periodic sync when offline
      this.stopPeriodicSync();
    }
  }

  async triggerSync(): Promise<void> {
    try {
      console.log('[DataSync] Starting sync process');
      
      // Get all local events that need syncing
      const localEvents = await this.localDB.getAllEvents();
      
      for (const localEvent of localEvents) {
        await this.syncEvent(localEvent.id);
      }
      
      console.log('[DataSync] Sync process completed');
    } catch (error) {
      console.error('[DataSync] Sync process failed:', error);
    }
  }

  async syncEvent(eventId: string): Promise<void> {
    try {
      console.log(`[DataSync] Syncing event: ${eventId}`);
      
      const [localEvent, remoteEvent] = await Promise.all([
        this.localDB.getEvent(eventId),
        this.cloudStorage.getEvent(eventId).catch(() => null)
      ]);

      if (!localEvent && !remoteEvent) {
        console.log(`[DataSync] Event ${eventId} not found locally or remotely`);
        return;
      }

      if (!localEvent && remoteEvent) {
        // Remote event exists, save locally
        await this.localDB.saveEvent(remoteEvent);
        console.log(`[DataSync] Downloaded remote event: ${eventId}`);
        return;
      }

      if (localEvent && !remoteEvent) {
        // Local event exists, upload to cloud
        await this.cloudStorage.saveEvent(localEvent);
        console.log(`[DataSync] Uploaded local event: ${eventId}`);
        return;
      }

      if (localEvent && remoteEvent) {
        // Both exist, check for conflicts and resolve
        await this.resolveEventConflicts(localEvent, remoteEvent);
      }
    } catch (error) {
      console.error(`[DataSync] Failed to sync event ${eventId}:`, error);
    }
  }

  private async resolveEventConflicts(localEvent: CloudEvent, remoteEvent: CloudEvent): Promise<void> {
    console.log(`[DataSync] Resolving conflicts for event: ${localEvent.id}`);
    
    const conflicts: SyncConflict[] = [];
    let mergedEvent = { ...localEvent };

    // Compare last modified timestamps
    if (remoteEvent.lastModified > localEvent.lastModified) {
      // Remote is newer, use remote as base
      mergedEvent = { ...remoteEvent };
      
      // But check for local changes that are newer than remote
      await this.mergeLocalChanges(mergedEvent, localEvent, conflicts);
    } else if (localEvent.lastModified > remoteEvent.lastModified) {
      // Local is newer, keep local as base
      // But merge any remote changes that don't conflict
      await this.mergeRemoteChanges(mergedEvent, remoteEvent, conflicts);
    } else {
      // Same timestamp, merge both
      await this.mergeBothEvents(mergedEvent, localEvent, remoteEvent, conflicts);
    }

    // Handle conflicts if any
    if (conflicts.length > 0) {
      console.warn(`[DataSync] Found ${conflicts.length} conflicts for event ${localEvent.id}`);
      await this.handleConflicts(mergedEvent, conflicts);
    }

    // Save merged event to both storages
    mergedEvent.lastModified = Date.now();
    await Promise.all([
      this.localDB.saveEvent(mergedEvent),
      this.cloudStorage.saveEvent(mergedEvent)
    ]);

    console.log(`[DataSync] Event ${localEvent.id} synced successfully`);
  }

  private async mergeLocalChanges(
    mergedEvent: CloudEvent, 
    localEvent: CloudEvent, 
    conflicts: SyncConflict[]
  ): Promise<void> {
    // Merge expenses - local additions take precedence
    const remoteExpenseIds = new Set(mergedEvent.expenses.map(e => e.id));
    const localOnlyExpenses = localEvent.expenses.filter(e => !remoteExpenseIds.has(e.id));
    
    mergedEvent.expenses.push(...localOnlyExpenses);

    // Merge participants - local additions take precedence
    const remoteParticipantIds = new Set(mergedEvent.participants.map(p => p.telegramId));
    const localOnlyParticipants = localEvent.participants.filter(p => !remoteParticipantIds.has(p.telegramId));
    
    mergedEvent.participants.push(...localOnlyParticipants);

    // Check for modified expenses (conflicts)
    for (const localExpense of localEvent.expenses) {
      const remoteExpense = mergedEvent.expenses.find(e => e.id === localExpense.id);
      if (remoteExpense && this.hasExpenseChanged(localExpense, remoteExpense)) {
        conflicts.push({
          type: 'expense_conflict',
          localData: localExpense,
          remoteData: remoteExpense,
          timestamp: Date.now()
        });
      }
    }
  }

  private async mergeRemoteChanges(
    mergedEvent: CloudEvent, 
    remoteEvent: CloudEvent, 
    conflicts: SyncConflict[]
  ): Promise<void> {
    // Similar logic but prioritizing local changes
    const localExpenseIds = new Set(mergedEvent.expenses.map(e => e.id));
    const remoteOnlyExpenses = remoteEvent.expenses.filter(e => !localExpenseIds.has(e.id));
    
    mergedEvent.expenses.push(...remoteOnlyExpenses);

    const localParticipantIds = new Set(mergedEvent.participants.map(p => p.telegramId));
    const remoteOnlyParticipants = remoteEvent.participants.filter(p => !localParticipantIds.has(p.telegramId));
    
    mergedEvent.participants.push(...remoteOnlyParticipants);
  }

  private async mergeBothEvents(
    mergedEvent: CloudEvent,
    localEvent: CloudEvent,
    remoteEvent: CloudEvent,
    conflicts: SyncConflict[]
  ): Promise<void> {
    // Complex merge logic for same timestamps
    // Combine all unique expenses and participants
    const allExpenses = [...localEvent.expenses, ...remoteEvent.expenses];
    const uniqueExpenses = allExpenses.filter((expense, index, array) => 
      array.findIndex(e => e.id === expense.id) === index
    );
    
    const allParticipants = [...localEvent.participants, ...remoteEvent.participants];
    const uniqueParticipants = allParticipants.filter((participant, index, array) => 
      array.findIndex(p => p.telegramId === participant.telegramId) === index
    );

    mergedEvent.expenses = uniqueExpenses;
    mergedEvent.participants = uniqueParticipants;
  }

  private hasExpenseChanged(expense1: CloudExpense, expense2: CloudExpense): boolean {
    return (
      expense1.description !== expense2.description ||
      expense1.amount !== expense2.amount ||
      expense1.currency !== expense2.currency ||
      expense1.paidBy !== expense2.paidBy ||
      JSON.stringify(expense1.sharedBy.sort()) !== JSON.stringify(expense2.sharedBy.sort())
    );
  }

  private async handleConflicts(event: CloudEvent, conflicts: SyncConflict[]): Promise<void> {
    console.log(`[DataSync] Handling ${conflicts.length} conflicts for event ${event.id}`);
    
    // For now, implement simple conflict resolution:
    // - Most recent change wins
    // - Log conflicts for debugging
    
    for (const conflict of conflicts) {
      console.warn('[DataSync] Conflict detected:', conflict);
      
      switch (conflict.type) {
        case 'expense_conflict':
          // Use the expense with the most recent modification
          const localExpense = conflict.localData as CloudExpense;
          const remoteExpense = conflict.remoteData as CloudExpense;
          
          const winningExpense = localExpense.createdAt > remoteExpense.createdAt 
            ? localExpense 
            : remoteExpense;
          
          // Replace in merged event
          const expenseIndex = event.expenses.findIndex(e => e.id === winningExpense.id);
          if (expenseIndex >= 0) {
            event.expenses[expenseIndex] = winningExpense;
          }
          break;
          
        default:
          console.warn(`[DataSync] Unknown conflict type: ${conflict.type}`);
      }
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const isOnline = navigator.onLine;
      const lastSyncTime = await this.getLastSyncTime();
      const pendingChanges = await this.getPendingChangesCount();
      
      return {
        isOnline,
        lastSyncTime,
        pendingChanges,
        conflicts: [] // TODO: Implement conflict tracking
      };
    } catch (error) {
      console.error('[DataSync] Failed to get sync status:', error);
      return {
        isOnline: false,
        lastSyncTime: 0,
        pendingChanges: 0,
        conflicts: []
      };
    }
  }

  private async getLastSyncTime(): Promise<number> {
    try {
      const syncData = await this.localDB.getItem('last_sync_time');
      return syncData ? parseInt(syncData) : 0;
    } catch {
      return 0;
    }
  }

  private async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await this.localDB.setItem('last_sync_time', timestamp.toString());
    } catch (error) {
      console.error('[DataSync] Failed to set last sync time:', error);
    }
  }

  private async getPendingChangesCount(): Promise<number> {
    try {
      // Count local events that haven't been synced recently
      const localEvents = await this.localDB.getAllEvents();
      const lastSyncTime = await this.getLastSyncTime();
      
      return localEvents.filter(event => event.lastModified > lastSyncTime).length;
    } catch {
      return 0;
    }
  }

  async forceSync(): Promise<void> {
    console.log('[DataSync] Force sync triggered');
    await this.triggerSync();
    await this.setLastSyncTime(Date.now());
  }

  destroy(): void {
    this.stopPeriodicSync();
    window.removeEventListener('online', () => this.handleOnlineStatus(true));
    window.removeEventListener('offline', () => this.handleOnlineStatus(false));
  }
}

// Singleton instance
let dataSyncManager: DataSyncManager | null = null;

export const getDataSyncManager = (): DataSyncManager => {
  if (!dataSyncManager) {
    dataSyncManager = new DataSyncManager();
  }
  return dataSyncManager;
}; 