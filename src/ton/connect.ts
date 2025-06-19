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
    // Use a more reliable manifest URL
    const manifestUrl = process.env.NODE_ENV === 'production' 
      ? 'https://splitton-hackathon.vercel.app/tonconnect-manifest.json'
      : `${window.location.origin}/tonconnect-manifest.json`;
      
    console.log('TON Connect manifest URL:', manifestUrl);
    
    this.connector = new TonConnect({
      manifestUrl
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
      console.log('Starting wallet connection...');
      await this.init();

      let targetWallet = wallet;
      
      if (!targetWallet) {
        console.log('Getting available wallets...');
        const wallets = await this.getWallets();
        console.log('Available wallets:', wallets.length);
        
        if (wallets.length === 0) {
          throw new Error('No TON wallets found. Please install a TON wallet like Tonkeeper, OpenMask, or TON Wallet.');
        }
        
        // Prefer Tonkeeper if available, otherwise use first wallet
        targetWallet = wallets.find(w => w.name.toLowerCase().includes('tonkeeper')) || wallets[0];
        console.log('Selected wallet:', targetWallet.name);
      }

      console.log('Connecting to wallet:', targetWallet.name);
      await this.connector.connect(targetWallet);

      const walletInfo = this.getWalletInfo();
      console.log('Wallet connected successfully:', walletInfo);
      return walletInfo;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          throw new Error('Wallet connection was rejected by user');
        } else if (error.message.includes('not found')) {
          throw new Error('No TON wallet found. Please install Tonkeeper or another TON wallet.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Connection timeout. Please try again.');
        }
        throw error;
      }
      
      throw new Error('Failed to connect wallet. Please try again.');
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

// Export singleton instance with initialization
let tonConnectManagerInstance: TonConnectManager | null = null;

export const getTonConnectManager = (): TonConnectManager => {
  if (!tonConnectManagerInstance) {
    tonConnectManagerInstance = TonConnectManager.getInstance();
  }
  return tonConnectManagerInstance;
};

// Legacy export for backwards compatibility
export const tonConnectManager = getTonConnectManager(); 