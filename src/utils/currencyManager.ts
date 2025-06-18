export interface ExchangeRate {
  currency: string;
  rate: number; // Rate to TON
  lastUpdated: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export class CurrencyManager {
  private static instance: CurrencyManager;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly UPDATE_INTERVAL = 60 * 1000; // 1 minute

  static getInstance(): CurrencyManager {
    if (!CurrencyManager.instance) {
      CurrencyManager.instance = new CurrencyManager();
    }
    return CurrencyManager.instance;
  }

  constructor() {
    this.initializeDefaultRates();
    this.startPeriodicUpdates();
  }

  private initializeDefaultRates(): void {
    // Initialize with some default rates (fallback values)
    const defaultRates = [
      { currency: 'USD', rate: 0.5, lastUpdated: Date.now() },
      { currency: 'EUR', rate: 0.45, lastUpdated: Date.now() },
      { currency: 'GBP', rate: 0.4, lastUpdated: Date.now() },
      { currency: 'RUB', rate: 50, lastUpdated: Date.now() },
    ];

    defaultRates.forEach(rate => {
      this.exchangeRates.set(rate.currency, rate);
    });
  }

  private startPeriodicUpdates(): void {
    // Update rates every minute
    this.updateInterval = setInterval(() => {
      this.updateAllRates();
    }, this.UPDATE_INTERVAL);
  }

  async getExchangeRate(currency: string): Promise<number> {
    const cached = this.exchangeRates.get(currency.toUpperCase());
    
    // Return cached rate if it's recent
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached.rate;
    }

    // Try to fetch fresh rate
    try {
      const rate = await this.fetchExchangeRate(currency);
      if (rate > 0) {
        this.exchangeRates.set(currency.toUpperCase(), {
          currency: currency.toUpperCase(),
          rate,
          lastUpdated: Date.now(),
        });
        return rate;
      }
    } catch (error) {
      console.warn(`Failed to fetch exchange rate for ${currency}:`, error);
    }

    // Return cached rate even if old, or default
    return cached?.rate || 1;
  }

  private async fetchExchangeRate(currency: string): Promise<number> {
    const upperCurrency = currency.toUpperCase();
    
    try {
      // Try CoinGecko API first (free tier)
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=${upperCurrency}`,
        { 
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tonPrice = data['the-open-network']?.[currency.toLowerCase()];
        
        if (tonPrice && tonPrice > 0) {
          return 1 / tonPrice; // Convert to TON rate (how many TON per 1 currency unit)
        }
      }
    } catch (error) {
      console.warn('CoinGecko API failed, trying alternative:', error);
    }

    // Fallback to exchange rate API for fiat currencies
    try {
      if (['USD', 'EUR', 'GBP', 'JPY', 'RUB'].includes(upperCurrency)) {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/USD`
        );

        if (response.ok) {
          const data = await response.json();
          const fiatRate = data.rates[upperCurrency] || 1;
          
          // Assume 1 TON = $2 as fallback (this should be updated with real TON price)
          const tonUsdPrice = 2;
          return fiatRate / tonUsdPrice;
        }
      }
    } catch (error) {
      console.warn('Exchange rate API failed:', error);
    }

    throw new Error(`Unable to fetch exchange rate for ${currency}`);
  }

  async convertToTon(amount: number, currency: string): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    return amount / rate;
  }

  async convertFromTon(tonAmount: number, currency: string): Promise<number> {
    const rate = await this.getExchangeRate(currency);
    return tonAmount * rate;
  }

  async updateAllRates(): Promise<void> {
    const currencies = Array.from(this.exchangeRates.keys());
    
    const updatePromises = currencies.map(async (currency) => {
      try {
        const rate = await this.fetchExchangeRate(currency);
        this.exchangeRates.set(currency, {
          currency,
          rate,
          lastUpdated: Date.now(),
        });
      } catch (error) {
        console.warn(`Failed to update rate for ${currency}:`, error);
      }
    });

    await Promise.allSettled(updatePromises);
  }

  getSupportedCurrencies(): CurrencyInfo[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2 },
      { code: 'TON', name: 'Toncoin', symbol: 'TON', decimals: 9 },
    ];
  }

  formatAmount(amount: number, currency: string): string {
    const currencyInfo = this.getSupportedCurrencies().find(
      c => c.code === currency.toUpperCase()
    );

    if (!currencyInfo) {
      return `${amount.toFixed(2)} ${currency}`;
    }

    const formatted = amount.toFixed(currencyInfo.decimals);
    
    // Add currency symbol
    switch (currencyInfo.code) {
      case 'USD':
      case 'GBP':
        return `${currencyInfo.symbol}${formatted}`;
      case 'EUR':
        return `${formatted}${currencyInfo.symbol}`;
      case 'RUB':
        return `${formatted} ${currencyInfo.symbol}`;
      case 'TON':
        return `${formatted} ${currencyInfo.symbol}`;
      default:
        return `${formatted} ${currency}`;
    }
  }

  getCurrencySymbol(currency: string): string {
    const currencyInfo = this.getSupportedCurrencies().find(
      c => c.code === currency.toUpperCase()
    );
    return currencyInfo?.symbol || currency;
  }

  // Get exchange rate status for UI
  getRateStatus(currency: string): 'fresh' | 'stale' | 'missing' {
    const rate = this.exchangeRates.get(currency.toUpperCase());
    
    if (!rate) return 'missing';
    
    const age = Date.now() - rate.lastUpdated;
    return age < this.CACHE_DURATION ? 'fresh' : 'stale';
  }

  // Clean up
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const currencyManager = CurrencyManager.getInstance(); 