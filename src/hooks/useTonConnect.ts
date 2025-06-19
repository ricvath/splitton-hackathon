import { useState, useEffect, useCallback } from 'react';
import { currencyManager } from '../utils/currencyManager';
import type { TonConnectManager, WalletInfo, Settlement } from '../ton/connect';

// Dynamic import types for the manager when loaded
type LoadedTonConnectManager = TonConnectManager;

export interface UseTonConnectReturn {
  // Wallet state
  wallet: WalletInfo | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Wallet actions
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  
  // Balance information
  balance: string;
  balanceUsd: string;
  refreshBalance: () => Promise<void>;
  
  // Settlement functionality
  sendSettlement: (settlement: Settlement) => Promise<string | null>;
  
  // Utility functions
  formatAddress: (address: string) => string;
  isValidAddress: (address: string) => boolean;
}

export const useTonConnect = (): UseTonConnectReturn => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [balanceUsd, setBalanceUsd] = useState('$0.00');
  const [tonConnectManager, setTonConnectManager] = useState<LoadedTonConnectManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Dynamically load TON Connect to avoid Buffer issues on initial load
  const loadTonConnect = useCallback(async () => {
    if (tonConnectManager) return tonConnectManager;
    
    try {
      console.log('Loading TON Connect module...');
      const { getTonConnectManager } = await import('../ton/connect');
      const manager = getTonConnectManager();
      setTonConnectManager(manager);
      return manager;
    } catch (err) {
      console.error('Failed to load TON Connect module:', err);
      setError(`TON Connect module error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, [tonConnectManager]);

  // Initialize TON Connect and check for existing connection
  useEffect(() => {
    const initializeTonConnect = async () => {
      if (isInitialized) return;
      
      try {
        const manager = await loadTonConnect();
        if (!manager) return;
        
        await manager.init();
        setIsInitialized(true);
        
        // Check if wallet is already connected
        const walletInfo = manager.getWalletInfo();
        if (walletInfo) {
          console.log('useTonConnect: Wallet info:', walletInfo);
          setWallet(walletInfo);
          await refreshBalanceInternal(manager, walletInfo);
        }

        // Listen for wallet changes
        manager.onWalletChange((walletInfo: WalletInfo) => {
          setWallet(walletInfo);
          if (walletInfo) {
            refreshBalanceInternal(manager, walletInfo);
          } else {
            setBalance('0');
            setBalanceUsd('$0.00');
          }
        });
      } catch (err) {
        console.error('Failed to initialize TON Connect:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      }
    };

    initializeTonConnect();
  }, [isInitialized, loadTonConnect]);

  const refreshBalanceInternal = async (manager: LoadedTonConnectManager, walletInfo: WalletInfo) => {
    if (!walletInfo?.address) return;

    try {
      const tonBalance = await manager.getWalletBalance(walletInfo.address);
      setBalance(tonBalance);

      // Convert to USD for display
      const usdValue = await currencyManager.convertFromTon(parseFloat(tonBalance), 'USD');
      setBalanceUsd(currencyManager.formatAmount(usdValue, 'USD'));
    } catch (err) {
      console.error('Failed to refresh balance:', err);
      // Don't set error for balance refresh failures
    }
  };

  const connectWallet = useCallback(async (): Promise<boolean> => {
    if (isConnecting) return false;
    
    setIsConnecting(true);
    setError(null);

    try {
      console.log('useTonConnect: Starting wallet connection...');
      const manager = await loadTonConnect();
      if (!manager) {
        setError('TON Connect module failed to load. Please refresh and try again.');
        return false;
      }

      console.log('useTonConnect: Manager loaded, connecting wallet...');
      const walletInfo = await manager.connectWallet();
      
      if (walletInfo) {
        console.log('useTonConnect: Wallet connected successfully');
        setWallet(walletInfo);
        await refreshBalanceInternal(manager, walletInfo);
        return true;
      } else {
        setError('Wallet connection returned no information');
        return false;
      }
    } catch (err) {
      console.error('useTonConnect: Wallet connection failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, loadTonConnect]);

  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      const manager = await loadTonConnect();
      if (manager) {
        await manager.disconnectWallet();
      }
      setWallet(null);
      setBalance('0');
      setBalanceUsd('$0.00');
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  }, [loadTonConnect]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!wallet?.address || !tonConnectManager) return;
    await refreshBalanceInternal(tonConnectManager, wallet);
  }, [wallet, tonConnectManager]);

  const sendSettlement = useCallback(async (settlement: Settlement): Promise<string | null> => {
    if (!wallet) {
      setError('Wallet not connected');
      return null;
    }

    const manager = await loadTonConnect();
    if (!manager) {
      setError('TON Connect not available');
      return null;
    }

    setError(null);

    try {
      const result = await manager.sendSettlement(settlement);
      
      if (result) {
        // Refresh balance after successful transaction
        setTimeout(() => refreshBalanceInternal(manager, wallet), 2000);
        return result;
      } else {
        setError('Transaction failed');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      console.error('Settlement failed:', err);
      return null;
    }
  }, [wallet, loadTonConnect]);

  const formatAddress = useCallback((address: string): string => {
    if (!tonConnectManager) return address;
    return tonConnectManager.formatAddress(address);
  }, [tonConnectManager]);

  const isValidAddress = useCallback((address: string): boolean => {
    if (!tonConnectManager) return false;
    return tonConnectManager.isValidTonAddress(address);
  }, [tonConnectManager]);

  return {
    // Wallet state
    wallet,
    isConnected: !!wallet,
    isConnecting,
    error,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    
    // Balance information
    balance,
    balanceUsd,
    refreshBalance,
    
    // Settlement functionality
    sendSettlement,
    
    // Utility functions
    formatAddress,
    isValidAddress,
  };
}; 