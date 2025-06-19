import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getDataSyncManager, SyncStatus as SyncStatusType } from '@/storage/dataSync';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    isOnline: navigator.onLine,
    lastSyncTime: 0,
    pendingChanges: 0,
    conflicts: []
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const syncManager = getDataSyncManager();

  useEffect(() => {
    const updateSyncStatus = async () => {
      try {
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('[SyncStatus] Failed to get sync status:', error);
      }
    };

    // Initial load
    updateSyncStatus();

    // Update every 10 seconds
    const interval = setInterval(updateSyncStatus, 10000);

    // Listen for online/offline events
    const handleOnline = () => updateSyncStatus();
    const handleOffline = () => updateSyncStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncManager]);

  const handleForceSync = async () => {
    if (!syncStatus.isOnline) return;
    
    setIsRefreshing(true);
    try {
      await syncManager.forceSync();
      const newStatus = await syncManager.getSyncStatus();
      setSyncStatus(newStatus);
    } catch (error) {
      console.error('[SyncStatus] Force sync failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastSync = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getStatusColor = (): string => {
    if (!syncStatus.isOnline) return 'bg-gray-500';
    if (syncStatus.conflicts.length > 0) return 'bg-yellow-500';
    if (syncStatus.pendingChanges > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = (): string => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.conflicts.length > 0) return 'Conflicts';
    if (syncStatus.pendingChanges > 0) return 'Syncing';
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="w-3 h-3" />;
    if (syncStatus.conflicts.length > 0) return <AlertCircle className="w-3 h-3" />;
    if (syncStatus.pendingChanges > 0) return <RefreshCw className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  if (!showDetails) {
    // Compact version - just a status badge
    return (
      <div className={className}>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor()} text-white border-0 text-xs`}
        >
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </Badge>
      </div>
    );
  }

  // Detailed version
  return (
    <div className={`bg-white rounded-lg border p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {syncStatus.isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <Button
          onClick={handleForceSync}
          disabled={!syncStatus.isOnline || isRefreshing}
          variant="ghost"
          size="sm"
          className="h-6 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Last sync:</span>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatLastSync(syncStatus.lastSyncTime)}</span>
          </div>
        </div>

        {syncStatus.pendingChanges > 0 && (
          <div className="flex items-center justify-between">
            <span>Pending changes:</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              {syncStatus.pendingChanges}
            </Badge>
          </div>
        )}

        {syncStatus.conflicts.length > 0 && (
          <div className="flex items-center justify-between">
            <span>Conflicts:</span>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
              {syncStatus.conflicts.length}
            </Badge>
          </div>
        )}

        {syncStatus.isOnline && syncStatus.pendingChanges === 0 && syncStatus.conflicts.length === 0 && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span>All data synced</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatus; 