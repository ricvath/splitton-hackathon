import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { currencyManager } from '../utils/currencyManager';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface CurrencyConverterProps {
  className?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ className }) => {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('TON');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supportedCurrencies = currencyManager.getSupportedCurrencies();

  // Load exchange rates
  const loadExchangeRates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const rates: Record<string, number> = {};
      
      for (const currency of supportedCurrencies) {
        if (currency.code !== 'TON') {
          try {
            const rate = await currencyManager.getExchangeRate(currency.code);
            rates[currency.code] = rate;
          } catch (err) {
            console.warn(`Failed to get rate for ${currency.code}:`, err);
          }
        }
      }
      
      setExchangeRates(rates);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load exchange rates');
      console.error('Exchange rate loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert currency
  const convertCurrency = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setConvertedAmount(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const numAmount = parseFloat(amount);
      let result: number;

      if (fromCurrency === 'TON' && toCurrency !== 'TON') {
        result = await currencyManager.convertFromTon(numAmount, toCurrency);
      } else if (fromCurrency !== 'TON' && toCurrency === 'TON') {
        result = await currencyManager.convertToTon(numAmount, fromCurrency);
      } else if (fromCurrency === toCurrency) {
        result = numAmount;
      } else {
        // Convert through TON (from -> TON -> to)
        const tonAmount = await currencyManager.convertToTon(numAmount, fromCurrency);
        result = await currencyManager.convertFromTon(tonAmount, toCurrency);
      }

      setConvertedAmount(result);
    } catch (err) {
      setError('Conversion failed');
      setConvertedAmount(null);
      console.error('Currency conversion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-convert when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      convertCurrency();
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency]);

  // Load rates on mount
  useEffect(() => {
    loadExchangeRates();
  }, []);

  const getRateStatus = (currency: string): 'fresh' | 'stale' | 'missing' => {
    return currencyManager.getRateStatus(currency);
  };

  const getStatusColor = (status: 'fresh' | 'stale' | 'missing') => {
    switch (status) {
      case 'fresh': return 'bg-green-100 text-green-800';
      case 'stale': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Currency Converter</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadExchangeRates}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Conversion Interface */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">From</label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapCurrencies}
              className="rounded-full"
            >
              ⇅
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-sm font-medium">Converted Amount</label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Converting...</span>
                  </div>
                ) : convertedAmount !== null ? (
                  <span className="font-mono text-lg">
                    {currencyManager.formatAmount(convertedAmount, toCurrency)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Enter amount to convert</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">To</label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Separator />

        {/* Exchange Rates Display */}
        <div>
          <h3 className="font-medium mb-3">Current Exchange Rates (to TON)</h3>
          <div className="grid grid-cols-2 gap-3">
            {supportedCurrencies
              .filter(currency => currency.code !== 'TON')
              .map((currency) => {
                const rate = exchangeRates[currency.code];
                const status = getRateStatus(currency.code);
                
                return (
                  <div
                    key={currency.code}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {currency.symbol} {currency.code}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rate ? `1 ${currency.code} = ${rate.toFixed(6)} TON` : 'Loading...'}
                      </div>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Rate Status Legend */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">fresh</Badge>
            <span>Updated within 5 minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800">stale</Badge>
            <span>Older than 5 minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-100 text-red-800">missing</Badge>
            <span>No rate available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 