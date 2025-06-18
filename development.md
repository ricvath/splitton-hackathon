## 🚀 **Development Structure & Strategy**

### **Phase 1: Foundation Setup**

here's the Telegram bot I've made: splitton_bot , called: SplitTON  
  
Use this token to access the HTTP API:  
7727706756:AAGaPHmDxIp8w3cXJ24surRJdkAw7_bZKWE

Based on the [TON Community TWA template](https://github.com/ton-community/twa-template), here's how I'd structure the development:

#### **1.1 Project Architecture**
```
ton-expense-split/
├── src/
│   ├── telegram/
│   │   ├── init.ts              # Telegram WebApp SDK initialization
│   │   └── utils.ts             # Telegram-specific utilities
│   ├── ton/
│   │   ├── connect.ts           # TON Connect 2.0 integration
│   │   ├── contracts/           # Smart contracts (optional)
│   │   └── utils.ts             # TON-specific utilities
│   ├── storage/
│   │   ├── cloudStorage.ts      # Telegram Cloud Storage
│   │   ├── indexedDB.ts         # Local IndexedDB fallback
│   │   └── dataSync.ts          # Data synchronization logic
│   ├── components/              # Reuse your existing components
│   └── hooks/
│       ├── useTonConnect.ts     # TON wallet connection
│       └── useTelegramData.ts   # Telegram user data
```

#### **1.2 Storage Strategy (Critical for Web3)**

Since you can't use a traditional backend, here's the multi-layered approach I recommend:

**Primary Storage: Telegram Cloud Storage**
- Telegram provides cloud storage for TWAs (up to 1MB per user)
- Perfect for expense data, participant lists, and event metadata
- Automatically synced across user's devices
- Accessible via `window.Telegram.WebApp.CloudStorage`

**Secondary Storage: Local IndexedDB**
- Offline functionality and caching
- Faster access for frequently used data
- Backup when cloud storage is unavailable

**Tertiary: TON Storage (for settlements)**
- Only store settlement transactions and final balances on-chain
- Use for verification and dispute resolution

### **Phase 2: Core Integration**

#### **2.1 TON Connect 2.0 Integration**

```typescript
// src/ton/connect.ts
import { TonConnect } from '@tonconnect/sdk';

export class TonConnectManager {
  private connector: TonConnect;

  constructor() {
    this.connector = new TonConnect({
      manifestUrl: 'https://your-domain.com/tonconnect-manifest.json'
    });
  }

  async connectWallet() {
    const walletsList = await this.connector.getWallets();
    // Show wallet selection UI
    return this.connector.connect(selectedWallet);
  }

  async sendSettlement(toAddress: string, amount: number) {
    return this.connector.sendTransaction({
      to: toAddress,
      value: amount.toString(),
      data: 'Settlement for event expenses'
    });
  }
}
```

#### **2.2 Telegram WebApp Integration**

```typescript
// src/telegram/init.ts
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        close(): void;
        initDataUnsafe: {
          user: { id: number; username: string; first_name: string; };
        };
        CloudStorage: {
          setItem(key: string, value: string, callback?: () => void): void;
          getItem(key: string, callback: (error: Error | null, value?: string) => void): void;
        };
      };
    };
  }
}

export const initTelegram = () => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
};
```

### **Phase 3: Data Architecture**

#### **3.1 Data Structure for Cloud Storage**

```typescript
// src/storage/types.ts
export interface CloudEvent {
  id: string;
  name: string;
  createdBy: string; // Telegram user ID
  participants: CloudParticipant[];
  expenses: CloudExpense[];
  imageUrl?: string;
  createdAt: number;
  lastModified: number;
}

export interface CloudParticipant {
  telegramId: string;
  username: string;
  walletAddress?: string; // TON wallet address
  joinedAt: number;
}

export interface CloudExpense {
  id: string;
  description: string;
  amount: number;
  currency: string; // USD, EUR, etc.
  tonEquivalent?: number; // Conversion rate at time of expense
  paidBy: string; // Telegram user ID
  sharedBy: string[]; // Array of Telegram user IDs
  createdAt: number;
}
```

#### **3.2 Storage Manager**

```typescript
// src/storage/cloudStorage.ts
export class CloudStorageManager {
  async saveEvent(event: CloudEvent): Promise<void> {
    const key = `event_${event.id}`;
    const data = JSON.stringify(event);
    
    return new Promise((resolve, reject) => {
      window.Telegram.WebApp.CloudStorage.setItem(key, data, () => {
        resolve();
      });
    });
  }

  async getEvent(eventId: string): Promise<CloudEvent | null> {
    const key = `event_${eventId}`;
    
    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          resolve(JSON.parse(value));
        }
      });
    });
  }

  async getUserEvents(userId: string): Promise<string[]> {
    // Store list of event IDs per user
    const key = `user_events_${userId}`;
    
    return new Promise((resolve) => {
      window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
        if (error || !value) {
          resolve([]);
        } else {
          resolve(JSON.parse(value));
        }
      });
    });
  }
}
```

### **Phase 4: Currency & Settlement System**

#### **4.1 Currency Conversion Handler**

```typescript
// src/utils/currency.ts
export class CurrencyManager {
  private exchangeRates: Record<string, number> = {};

  async getExchangeRate(from: string, to: string = 'TON'): Promise<number> {
    // Use a free API like exchangerate-api.com or coingecko
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=${from}`);
      const data = await response.json();
      return data['the-open-network'][from.toLowerCase()];
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return this.exchangeRates[from] || 1;
    }
  }

  async convertToTon(amount: number, currency: string): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    return amount / rate;
  }
}
```

#### **4.2 Settlement System**

```typescript
// src/utils/settlement.ts
export class SettlementManager {
  constructor(
    private tonConnect: TonConnectManager,
    private currencyManager: CurrencyManager
  ) {}

  async createSettlementPlan(
    balances: Record<string, number>,
    participants: CloudParticipant[],
    baseCurrency: string
  ) {
    const debts = getSimplifiedDebts(balances);
    const settlements = [];

    for (const debt of debts) {
      const fromParticipant = participants.find(p => p.telegramId === debt.from);
      const toParticipant = participants.find(p => p.telegramId === debt.to);

      if (fromParticipant?.walletAddress && toParticipant?.walletAddress) {
        const tonAmount = await this.currencyManager.convertToTon(debt.amount, baseCurrency);
        
        settlements.push({
          from: fromParticipant.walletAddress,
          to: toParticipant.walletAddress,
          amountFiat: debt.amount,
          amountTon: tonAmount,
          currency: baseCurrency,
        });
      }
    }

    return settlements;
  }

  async executeSettlement(settlement: any) {
    return this.tonConnect.sendSettlement(settlement.to, settlement.amountTon);
  }
}
```

### **Phase 5: User Experience & Sync**

#### **5.1 Event Invitation System**

Instead of URL-based invitations, use Telegram's sharing capabilities:

```typescript
// src/components/InviteSection.tsx (modified)
const shareEvent = (eventId: string, eventName: string) => {
  const shareUrl = `https://t.me/your_bot_username/app?startapp=${eventId}`;
  const shareText = `Join my expense splitting event: ${eventName}`;
  
  window.Telegram.WebApp.openTelegramLink(
    `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  );
};
```

#### **5.2 Data Synchronization**

```typescript
// src/storage/dataSync.ts
export class DataSyncManager {
  async syncEventData(eventId: string, participants: CloudParticipant[]) {
    // Each participant stores their own copy
    // Implement conflict resolution for concurrent edits
    const localEvent = await this.getLocalEvent(eventId);
    const remoteEvent = await this.getRemoteEvent(eventId);
    
    if (remoteEvent.lastModified > localEvent.lastModified) {
      // Remote is newer, update local
      await this.updateLocalEvent(remoteEvent);
    }
  }
}
```

## 🗂️ **Storage Without Backend - Detailed Strategy**

### **1. Telegram Cloud Storage (Primary)**
- **Capacity**: 1MB per user
- **Use for**: Event metadata, expenses, participant data
- **Pros**: Automatic sync, persistent, accessible across devices
- **Cons**: Size limitation, requires active Telegram session

### **2. IndexedDB (Secondary)**
- **Use for**: Caching, offline functionality, large data
- **Implementation**: Store frequently accessed data locally
- **Sync**: Periodically sync with cloud storage

### **3. Distributed Data Model**
Instead of centralized storage:
- Each participant stores their own copy of event data
- Use event IDs as shared keys
- Implement conflict resolution for concurrent edits
- Store only final settlements on TON blockchain

### **4. Event Discovery**
- Users store list of their event IDs in their cloud storage
- When invited to new events, add event ID to their personal list
- No central event registry needed

## 🎯 **Recommended Development Priority**

1. **Start with the TWA template** from the TON community
2. **Implement Telegram integration** first (user auth, cloud storage)
3. **Port your existing expense calculation logic** (it's already well-architected)
4. **Add TON Connect for wallet linking** (not required for basic functionality)
5. **Implement settlement system** last (advanced feature)

## 💡 **Key Advantages of This Approach**

1. **No backend costs** - All data stored in Telegram's cloud
2. **Natural user identification** - Telegram IDs eliminate need for separate auth
3. **Viral sharing** - Built-in Telegram sharing mechanisms
4. **Offline capability** - IndexedDB backup ensures app works offline
5. **Gradual adoption** - Users can use the app without connecting wallets initially

This architecture maintains the simplicity and user experience of your current app while adding the Web3 capabilities you want. The data storage strategy is the most critical part - using Telegram's cloud storage eliminates the need for a traditional backend while providing reliable, synced storage for your users.
