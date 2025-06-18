import { useState, useEffect, useCallback } from 'react';
import { tonConnectManager, WalletInfo, Settlement } from '../ton/connect';
import { currencyManager } from '../utils/currencyManager';

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

  // Initialize TON Connect and check for existing connection
  useEffect(() => {
    const initializeTonConnect = async () => {
      try {
        await tonConnectManager.init();
        
        // Check if wallet is already connected
        const walletInfo = tonConnectManager.getWalletInfo();
        if (walletInfo) {
          setWallet(walletInfo);
          await refreshBalance();
        }
      } catch (err) {
        console.error('Failed to initialize TON Connect:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      }
    };

    initializeTonConnect();

    // Listen for wallet changes
    tonConnectManager.onWalletChange((walletInfo) => {
      setWallet(walletInfo);
      if (walletInfo) {
        refreshBalance();
      } else {
        setBalance('0');
        setBalanceUsd('$0.00');
      }
    });
  }, []);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    if (isConnecting) return false;
    
    setIsConnecting(true);
    setError(null);

    try {
      const walletInfo = await tonConnectManager.connectWallet();
      
      if (walletInfo) {
        setWallet(walletInfo);
        await refreshBalance();
        return true;
      } else {
        setError('Failed to connect wallet');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection failed:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      await tonConnectManager.disconnectWallet();
      setWallet(null);
      setBalance('0');
      setBalanceUsd('$0.00');
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  }, []);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!wallet?.address) return;

    try {
      const tonBalance = await tonConnectManager.getWalletBalance(wallet.address);
      setBalance(tonBalance);

      // Convert to USD for display
      const usdValue = await currencyManager.convertFromTon(parseFloat(tonBalance), 'USD');
      setBalanceUsd(currencyManager.formatAmount(usdValue, 'USD'));
    } catch (err) {
      console.error('Failed to refresh balance:', err);
      // Don't set error for balance refresh failures
    }
  }, [wallet?.address]);

  const sendSettlement = useCallback(async (settlement: Settlement): Promise<string | null> => {
    if (!wallet) {
      setError('Wallet not connected');
      return null;
    }

    setError(null);

    try {
      const result = await tonConnectManager.sendSettlement(settlement);
      
      if (result) {
        // Refresh balance after successful transaction
        setTimeout(() => refreshBalance(), 2000);
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
  }, [wallet, refreshBalance]);

  const formatAddress = useCallback((address: string): string => {
    return tonConnectManager.formatAddress(address);
  }, []);

  const isValidAddress = useCallback((address: string): boolean => {
    return tonConnectManager.isValidTonAddress(address);
  }, []);

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