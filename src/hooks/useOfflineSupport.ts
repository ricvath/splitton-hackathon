import { useState, useEffect, useCallback } from 'react';
import { localDB } from '@/storage/indexedDB';
import { CloudStorageManager } from '@/storage/cloudStorage';
import { getDataSyncManager } from '@/storage/dataSync';

export interface OfflineAction {
  id: string;
  type: 'create_event' | 'add_expense' | 'edit_expense' | 'delete_expense' | 'join_event';
  data: any;
  timestamp: number;
  retry_count: number;
}

export interface OfflineState {
  isOnline: boolean;
  isSupported: boolean;
  pendingActions: OfflineAction[];
  lastSyncTime: number;
}

export const useOfflineSupport = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isSupported: 'serviceWorker' in navigator && 'indexedDB' in window,
    pendingActions: [],
    lastSyncTime: 0
  });

  const cloudStorage = CloudStorageManager.getInstance();
  const syncManager = getDataSyncManager();

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineSupport] Network back online');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      processPendingActions();
    };

    const handleOffline = () => {
      console.log('[OfflineSupport] Network went offline');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions on mount
  useEffect(() => {
    loadPendingActions();
  }, []);

  const loadPendingActions = async () => {
    try {
      const actionsData = await localDB.getItem('pending_offline_actions');
      const actions: OfflineAction[] = actionsData ? JSON.parse(actionsData) : [];
      
      setOfflineState(prev => ({
        ...prev,
        pendingActions: actions
      }));
    } catch (error) {
      console.error('[OfflineSupport] Failed to load pending actions:', error);
    }
  };

  const savePendingActions = async (actions: OfflineAction[]) => {
    try {
      await localDB.setItem('pending_offline_actions', JSON.stringify(actions));
      setOfflineState(prev => ({
        ...prev,
        pendingActions: actions
      }));
    } catch (error) {
      console.error('[OfflineSupport] Failed to save pending actions:', error);
    }
  };

  const queueOfflineAction = useCallback(async (
    type: OfflineAction['type'],
    data: any
  ): Promise<void> => {
    const action: OfflineAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retry_count: 0
    };

    console.log('[OfflineSupport] Queuing offline action:', action);

    const newActions = [...offlineState.pendingActions, action];
    await savePendingActions(newActions);

    // If we're online, try to process immediately
    if (offlineState.isOnline) {
      processPendingActions();
    }
  }, [offlineState.pendingActions, offlineState.isOnline]);

  const processPendingActions = async () => {
    if (!offlineState.isOnline || offlineState.pendingActions.length === 0) {
      return;
    }

    console.log(`[OfflineSupport] Processing ${offlineState.pendingActions.length} pending actions`);

    const remainingActions: OfflineAction[] = [];
    
    for (const action of offlineState.pendingActions) {
      try {
        const success = await executeOfflineAction(action);
        
        if (!success) {
          // Action failed, increment retry count
          action.retry_count += 1;
          
          // Keep action if retry count is less than 3
          if (action.retry_count < 3) {
            remainingActions.push(action);
          } else {
            console.warn('[OfflineSupport] Action exceeded max retries, discarding:', action);
          }
        }
        // If successful, action is not added to remainingActions (effectively removed)
      } catch (error) {
        console.error('[OfflineSupport] Failed to execute action:', action, error);
        action.retry_count += 1;
        
        if (action.retry_count < 3) {
          remainingActions.push(action);
        }
      }
    }

    await savePendingActions(remainingActions);
  };

  const executeOfflineAction = async (action: OfflineAction): Promise<boolean> => {
    console.log('[OfflineSupport] Executing action:', action);

    try {
      switch (action.type) {
        case 'create_event':
          await cloudStorage.saveEvent(action.data);
          await cloudStorage.addUserToEvent(action.data.createdBy, action.data.id);
          break;

        case 'add_expense':
          const event = await cloudStorage.getEvent(action.data.eventId);
          if (event) {
            event.expenses.push(action.data.expense);
            event.lastModified = Date.now();
            await cloudStorage.saveEvent(event);
          }
          break;

        case 'edit_expense':
          const eventForEdit = await cloudStorage.getEvent(action.data.eventId);
          if (eventForEdit) {
            const expenseIndex = eventForEdit.expenses.findIndex(e => e.id === action.data.expenseId);
            if (expenseIndex >= 0) {
              eventForEdit.expenses[expenseIndex] = action.data.expense;
              eventForEdit.lastModified = Date.now();
              await cloudStorage.saveEvent(eventForEdit);
            }
          }
          break;

        case 'delete_expense':
          const eventForDelete = await cloudStorage.getEvent(action.data.eventId);
          if (eventForDelete) {
            eventForDelete.expenses = eventForDelete.expenses.filter(e => e.id !== action.data.expenseId);
            eventForDelete.lastModified = Date.now();
            await cloudStorage.saveEvent(eventForDelete);
          }
          break;

        case 'join_event':
          const eventToJoin = await cloudStorage.getEvent(action.data.eventId);
          if (eventToJoin) {
            const existingParticipant = eventToJoin.participants.find(p => p.telegramId === action.data.participant.telegramId);
            if (!existingParticipant) {
              eventToJoin.participants.push(action.data.participant);
              eventToJoin.lastModified = Date.now();
              await cloudStorage.saveEvent(eventToJoin);
              await cloudStorage.addUserToEvent(action.data.participant.telegramId, action.data.eventId);
            }
          }
          break;

        default:
          console.warn('[OfflineSupport] Unknown action type:', action.type);
          return false;
      }

      console.log('[OfflineSupport] Action executed successfully:', action.type);
      return true;
    } catch (error) {
      console.error('[OfflineSupport] Action execution failed:', error);
      return false;
    }
  };

  const clearPendingActions = async () => {
    await savePendingActions([]);
  };

  const retryFailedActions = async () => {
    if (offlineState.isOnline) {
      await processPendingActions();
    }
  };

  // Enhanced storage methods that work offline
  const saveEventOffline = async (event: any) => {
    try {
      // Always save to local storage first
      await localDB.saveEvent(event);
      
      if (offlineState.isOnline) {
        // Try to save to cloud storage
        try {
          await cloudStorage.saveEvent(event);
          await cloudStorage.addUserToEvent(event.createdBy, event.id);
        } catch (error) {
          console.warn('[OfflineSupport] Cloud save failed, queuing for later:', error);
          await queueOfflineAction('create_event', event);
        }
      } else {
        // Queue for when we're back online
        await queueOfflineAction('create_event', event);
      }
    } catch (error) {
      console.error('[OfflineSupport] Failed to save event offline:', error);
      throw error;
    }
  };

  const addExpenseOffline = async (eventId: string, expense: any) => {
    try {
      // Save to local storage first
      const localEvent = await localDB.getEvent(eventId);
      if (localEvent) {
        localEvent.expenses.push(expense);
        localEvent.lastModified = Date.now();
        await localDB.saveEvent(localEvent);
      }

      if (offlineState.isOnline) {
        // Try to save to cloud storage
        try {
          const cloudEvent = await cloudStorage.getEvent(eventId);
          if (cloudEvent) {
            cloudEvent.expenses.push(expense);
            cloudEvent.lastModified = Date.now();
            await cloudStorage.saveEvent(cloudEvent);
          }
        } catch (error) {
          console.warn('[OfflineSupport] Cloud save failed, queuing for later:', error);
          await queueOfflineAction('add_expense', { eventId, expense });
        }
      } else {
        // Queue for when we're back online
        await queueOfflineAction('add_expense', { eventId, expense });
      }
    } catch (error) {
      console.error('[OfflineSupport] Failed to add expense offline:', error);
      throw error;
    }
  };

  const getEventOffline = async (eventId: string) => {
    try {
      // Try local storage first
      const localEvent = await localDB.getEvent(eventId);
      
      if (offlineState.isOnline) {
        try {
          // Try to get from cloud and merge if necessary
          const cloudEvent = await cloudStorage.getEvent(eventId);
          
          if (cloudEvent && localEvent) {
            // Return the more recent version
            return cloudEvent.lastModified > localEvent.lastModified ? cloudEvent : localEvent;
          } else if (cloudEvent) {
            // Save to local for offline access
            await localDB.saveEvent(cloudEvent);
            return cloudEvent;
          }
        } catch (error) {
          console.warn('[OfflineSupport] Cloud fetch failed, using local data:', error);
        }
      }
      
      return localEvent;
    } catch (error) {
      console.error('[OfflineSupport] Failed to get event offline:', error);
      return null;
    }
  };

  return {
    ...offlineState,
    queueOfflineAction,
    processPendingActions,
    clearPendingActions,
    retryFailedActions,
    saveEventOffline,
    addExpenseOffline,
    getEventOffline,
  };
};

export default useOfflineSupport; 