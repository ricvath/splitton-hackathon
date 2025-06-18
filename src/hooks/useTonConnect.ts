import { useState, useEffect, useCallback } from 'react';
import { tonConnect, TonWallet, Settlement } from '../ton/connect';
import { Wallet } from '@tonconnect/sdk';

export interface TonConnectState {
  wallet: TonWallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  availableWallets: Wallet[];
  error: string | null;
}

export const useTonConnect = () => {
  const [state, setState] = useState<TonConnectState>({
    wallet: null,
    isConnected: false,
    isConnecting: false,
    availableWallets: [],
    error: null,
  });

  // Load available wallets and check connection status
  useEffect(() => {
    const initTonConnect = async () => {
      try {
        const wallets = await tonConnect.getWallets();
        const connectedWallet = tonConnect.getConnectedWallet();
        
        setState(prev => ({
          ...prev,
          availableWallets: wallets,
          wallet: connectedWallet,
          isConnected: tonConnect.isConnected(),
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize TON Connect',
        }));
      }
    };

    initTonConnect();

    // Subscribe to wallet changes
    const unsubscribe = tonConnect.onWalletChange((wallet) => {
      setState(prev => ({
        ...prev,
        wallet,
        isConnected: !!wallet,
        isConnecting: false,
        error: null,
      }));
    });

    return unsubscribe;
  }, []);

  const connectWallet = useCallback(async (wallet?: Wallet) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const connectedWallet = await tonConnect.connectWallet(wallet);
      
      if (connectedWallet) {
        setState(prev => ({
          ...prev,
          wallet: connectedWallet,
          isConnected: true,
          isConnecting: false,
        }));
        return connectedWallet;
      } else {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Failed to connect wallet',
        }));
        return null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
      return null;
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await tonConnect.disconnectWallet();
      setState(prev => ({
        ...prev,
        wallet: null,
        isConnected: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet',
      }));
    }
  }, []);

  const sendSettlement = useCallback(async (settlement: Settlement): Promise<string | null> => {
    if (!state.isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not connected',
      }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      const transactionHash = await tonConnect.sendSettlement(settlement);
      
      if (!transactionHash) {
        setState(prev => ({
          ...prev,
          error: 'Transaction failed',
        }));
      }
      
      return transactionHash;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Transaction failed',
      }));
      return null;
    }
  }, [state.isConnected]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    sendSettlement,
    clearError,
  };
}; 