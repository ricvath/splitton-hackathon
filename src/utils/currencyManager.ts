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
    
    // Enhanced retry logic with multiple API sources
    const apiSources = [
      () => this.fetchFromCoinGecko(upperCurrency),
      () => this.fetchFromCoinMarketCap(upperCurrency),
      () => this.fetchFromExchangeRateAPI(upperCurrency),
    ];

    for (const apiCall of apiSources) {
      try {
        const rate = await this.retryWithBackoff(apiCall, 3);
        if (rate > 0) {
          return rate;
        }
      } catch (error) {
        console.warn(`API call failed, trying next source:`, error);
      }
    }

    throw new Error(`Unable to fetch exchange rate for ${currency} from any source`);
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>, 
    maxRetries: number, 
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async fetchFromCoinGecko(currency: string): Promise<number> {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=${currency}`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SplitTON-App/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const tonPrice = data['the-open-network']?.[currency.toLowerCase()];
    
    if (tonPrice && tonPrice > 0) {
      return 1 / tonPrice; // Convert to TON rate
    }
    
    throw new Error('Invalid price data from CoinGecko');
  }

  private async fetchFromCoinMarketCap(currency: string): Promise<number> {
    // Alternative API source (would need API key for production)
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TON&convert=${currency}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-CMC_PRO_API_KEY': 'demo-key', // Replace with real key
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    const tonPrice = data.data?.TON?.quote?.[currency]?.price;
    
    if (tonPrice && tonPrice > 0) {
      return 1 / tonPrice;
    }
    
    throw new Error('Invalid price data from CoinMarketCap');
  }

  private async fetchFromExchangeRateAPI(currency: string): Promise<number> {
    if (!['USD', 'EUR', 'GBP', 'JPY', 'RUB'].includes(currency)) {
      throw new Error(`Currency ${currency} not supported by exchange rate API`);
    }

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }

    const data = await response.json();
    const fiatRate = data.rates[currency] || 1;
    
    // Use a more realistic TON price (this should ideally come from a crypto API)
    const tonUsdPrice = 2.5; // Fallback price
    return fiatRate / tonUsdPrice;
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