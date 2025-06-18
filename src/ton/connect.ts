import { TonConnect, Wallet } from '@tonconnect/sdk';
import { Address, toNano } from '@ton/core';

export interface Settlement {
  from: string;
  to: string;
  amountFiat: number;
  amountTon: number;
  currency: string;
  description?: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  isConnected: boolean;
}

export class TonConnectManager {
  private static instance: TonConnectManager;
  private connector: TonConnect;
  private isInitialized = false;

  static getInstance(): TonConnectManager {
    if (!TonConnectManager.instance) {
      TonConnectManager.instance = new TonConnectManager();
    }
    return TonConnectManager.instance;
  }

  constructor() {
    this.connector = new TonConnect({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
    });
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Restore connection if exists
      await this.connector.restoreConnection();
      this.isInitialized = true;
      console.log('TON Connect initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TON Connect:', error);
      throw error;
    }
  }

  async getWallets(): Promise<Wallet[]> {
    try {
      return await this.connector.getWallets();
    } catch (error) {
      console.error('Failed to get wallets:', error);
      return [];
    }
  }

  async connectWallet(wallet?: Wallet): Promise<WalletInfo | null> {
    try {
      await this.init();

      if (wallet) {
        await this.connector.connect(wallet);
      } else {
        // Connect to first available wallet
        const wallets = await this.getWallets();
        if (wallets.length === 0) {
          throw new Error('No wallets available');
        }
        await this.connector.connect(wallets[0]);
      }

      const walletInfo = this.getWalletInfo();
      console.log('Wallet connected:', walletInfo);
      return walletInfo;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.connector.disconnect();
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }

  getWalletInfo(): WalletInfo | null {
    const wallet = this.connector.wallet;
    if (!wallet) return null;

    return {
      address: wallet.account.address,
      balance: '0', // Will be fetched separately
      isConnected: true,
    };
  }

  isWalletConnected(): boolean {
    return this.connector.connected;
  }

  async getWalletBalance(address?: string): Promise<string> {
    try {
      const walletAddress = address || this.connector.wallet?.account.address;
      if (!walletAddress) return '0';

      // In a real implementation, you would fetch from TON API
      // For now, return a placeholder
      return '0';
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return '0';
    }
  }

  async sendSettlement(settlement: Settlement): Promise<string | null> {
    try {
      if (!this.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: settlement.to,
            amount: toNano(settlement.amountTon).toString(),
            payload: settlement.description || `Settlement: ${settlement.amountFiat} ${settlement.currency}`,
          },
        ],
      };

      const result = await this.connector.sendTransaction(transaction);
      console.log('Settlement transaction sent:', result);
      return result.boc; // Return transaction hash
    } catch (error) {
      console.error('Failed to send settlement:', error);
      return null;
    }
  }

  async sendMultipleSettlements(settlements: Settlement[]): Promise<(string | null)[]> {
    const results: (string | null)[] = [];

    for (const settlement of settlements) {
      try {
        const result = await this.sendSettlement(settlement);
        results.push(result);
        
        // Add delay between transactions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Failed to send settlement:', settlement, error);
        results.push(null);
      }
    }

    return results;
  }

  // Event listeners for wallet state changes
  onWalletChange(callback: (wallet: WalletInfo | null) => void): void {
    this.connector.onStatusChange((wallet) => {
      if (wallet) {
        callback({
          address: wallet.account.address,
          balance: '0',
          isConnected: true,
        });
      } else {
        callback(null);
      }
    });
  }

  // Utility function to validate TON address
  isValidTonAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  // Format TON address for display
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }

  // Convert TON to nanoTON
  toNano(amount: number): bigint {
    return toNano(amount);
  }

  // Convert nanoTON to TON
  fromNano(amount: string | bigint): string {
    return (Number(amount) / 1e9).toFixed(9);
  }
}

export const tonConnectManager = TonConnectManager.getInstance(); 