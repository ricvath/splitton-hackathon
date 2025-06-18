import { TonConnect, Wallet } from '@tonconnect/sdk';

export interface TonWallet {
  address: string;
  publicKey: string;
  walletStateInit: string;
}

export interface Settlement {
  to: string;
  amount: string; // in nanotons
  comment?: string;
}

export class TonConnectManager {
  private connector: TonConnect;
  private static instance: TonConnectManager;

  private constructor() {
    this.connector = new TonConnect({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`
    });
  }

  static getInstance(): TonConnectManager {
    if (!TonConnectManager.instance) {
      TonConnectManager.instance = new TonConnectManager();
    }
    return TonConnectManager.instance;
  }

  async getWallets(): Promise<Wallet[]> {
    return this.connector.getWallets();
  }

  async connectWallet(wallet?: Wallet): Promise<TonWallet | null> {
    try {
      const walletConnection = await this.connector.connect(wallet);
      
      if (walletConnection) {
        return {
          address: walletConnection.account.address,
          publicKey: walletConnection.account.publicKey,
          walletStateInit: walletConnection.account.walletStateInit,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.connector.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }

  isConnected(): boolean {
    return this.connector.connected;
  }

  getConnectedWallet(): TonWallet | null {
    if (!this.connector.connected || !this.connector.account) {
      return null;
    }

    return {
      address: this.connector.account.address,
      publicKey: this.connector.account.publicKey,
      walletStateInit: this.connector.account.walletStateInit,
    };
  }

  async sendSettlement(settlement: Settlement): Promise<string | null> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: settlement.to,
            amount: settlement.amount,
            payload: settlement.comment ? this.createCommentPayload(settlement.comment) : undefined,
          },
        ],
      };

      const result = await this.connector.sendTransaction(transaction);
      return result.boc; // Return the transaction BOC
    } catch (error) {
      console.error('Failed to send settlement:', error);
      return null;
    }
  }

  private createCommentPayload(comment: string): string {
    // Create a simple comment payload
    // In a real implementation, you might want to use TonWeb or similar library
    const commentBytes = new TextEncoder().encode(comment);
    return Buffer.from(commentBytes).toString('base64');
  }

  // Convert TON amount to nanotons (1 TON = 1,000,000,000 nanotons)
  static tonToNanoton(ton: number): string {
    return (ton * 1_000_000_000).toString();
  }

  // Convert nanotons to TON
  static nanotonToTon(nanoton: string): number {
    return parseInt(nanoton) / 1_000_000_000;
  }

  // Subscribe to wallet connection changes
  onWalletChange(callback: (wallet: TonWallet | null) => void): () => void {
    const unsubscribe = this.connector.onStatusChange((wallet) => {
      if (wallet) {
        callback({
          address: wallet.account.address,
          publicKey: wallet.account.publicKey,
          walletStateInit: wallet.account.walletStateInit,
        });
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }
}

export const tonConnect = TonConnectManager.getInstance(); 