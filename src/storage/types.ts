export interface CloudEvent {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // Telegram user ID
  participants: CloudParticipant[];
  expenses: CloudExpense[];
  imageUrl?: string;
  currency: string; // Base currency for the event (USD, EUR, etc.)
  createdAt: number;
  lastModified: number;
  isActive: boolean;
}

export interface CloudParticipant {
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  walletAddress?: string; // TON wallet address
  joinedAt: number;
  isActive: boolean;
}

export interface CloudExpense {
  id: string;
  description: string;
  amount: number;
  currency: string; // Original currency of the expense
  tonEquivalent?: number; // Conversion rate at time of expense
  paidBy: string; // Telegram user ID
  sharedBy: string[]; // Array of Telegram user IDs
  category?: string;
  imageUrl?: string;
  createdAt: number;
  lastModified: number;
}

export interface CloudBalance {
  participantId: string;
  balance: number; // Positive = owed money, Negative = owes money
  currency: string;
  tonEquivalent?: number;
}

export interface CloudSettlement {
  id: string;
  eventId: string;
  from: string; // Telegram user ID
  to: string; // Telegram user ID
  amount: number;
  currency: string;
  tonAmount?: number;
  tonTransactionHash?: string; // TON blockchain transaction hash
  status: 'pending' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface UserEventList {
  userId: string;
  eventIds: string[];
  lastUpdated: number;
}

export interface EventInvitation {
  eventId: string;
  invitedBy: string;
  invitedAt: number;
  status: 'pending' | 'accepted' | 'declined';
}

// Storage keys for Telegram Cloud Storage
export const STORAGE_KEYS = {
  EVENT: (eventId: string) => `event_${eventId}`,
  USER_EVENTS: (userId: string) => `user_events_${userId}`,
  EVENT_BALANCES: (eventId: string) => `balances_${eventId}`,
  USER_PROFILE: (userId: string) => `profile_${userId}`,
  EVENT_SETTLEMENTS: (eventId: string) => `settlements_${eventId}`,
  INVITATIONS: (userId: string) => `invitations_${userId}`,
} as const;

// Exchange rate cache
export interface ExchangeRateCache {
  rates: Record<string, number>; // Currency to TON rates
  lastUpdated: number;
  baseCurrency: 'TON';
}

// User preferences
export interface UserPreferences {
  defaultCurrency: string;
  notifications: boolean;
  autoSettlement: boolean;
  preferredWallet?: string;
} 