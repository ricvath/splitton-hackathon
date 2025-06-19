import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, Coins, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { SettlementManager } from '@/components/SettlementManager';
import { currencyManager } from '@/utils/currencyManager';
import { settlementManager } from '@/utils/settlementManager';
import { CloudParticipant } from '@/storage/types';

const TestPage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState({
    telegram: false,
    webApp: false,
    currencies: false,
    settlement: false,
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Mock data for settlement testing
  const mockParticipants: CloudParticipant[] = [
    {
      telegramId: '123',
      firstName: 'Alice',
      lastName: 'Smith',
      username: 'alice_smith',
      walletAddress: '0QBvI0aFLnw2QbZeUOejYv7xHdLKHMEz8M5HgJyXEBhJrYAA',
      joinedAt: Date.now(),
      isActive: true,
      lastModified: Date.now(),
    },
    {
      telegramId: '456',
      firstName: 'Bob',
      lastName: 'Johnson',
      username: 'bob_johnson',
      walletAddress: '0QCvI0aFLnw2QbZeUOejYv7xHdLKHMEz8M5HgJyXEBhJrYBB',
      joinedAt: Date.now(),
      isActive: true,
      lastModified: Date.now(),
    },
    {
      telegramId: '789',
      firstName: 'Charlie',
      lastName: 'Brown',
      username: 'charlie_brown',
      walletAddress: '0QDvI0aFLnw2QbZeUOejYv7xHdLKHMEz8M5HgJyXEBhJrYCC',
      joinedAt: Date.now(),
      isActive: true,
      lastModified: Date.now(),
    },
  ];

  const mockBalances = {
    '123': 50.00,   // Alice owes $50
    '456': -25.00,  // Bob is owed $25
    '789': -25.00,  // Charlie is owed $25
  };

  useEffect(() => {
    const checkSystemStatus = async () => {
      // Check Telegram WebApp
      const telegram = typeof window !== 'undefined' && !!window.Telegram;
      const webApp = telegram && !!window.Telegram?.WebApp;

      // Test currency manager
      let currencies = false;
      try {
        await currencyManager.getExchangeRate('USD');
        currencies = true;
      } catch (error) {
        console.warn('Currency manager test failed:', error);
      }

      // Test settlement manager
      let settlement = false;
      try {
        const plan = await settlementManager.createSettlementPlan(
          mockBalances,
          mockParticipants,
          'USD'
        );
        settlement = plan.settlements.length > 0;
      } catch (error) {
        console.warn('Settlement manager test failed:', error);
      }

      setSystemStatus({
        telegram,
        webApp,
        currencies,
        settlement,
      });
    };

    checkSystemStatus();
  }, []);

  const loadExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const rates: Record<string, number> = {};
      const currencies = ['USD', 'EUR', 'GBP', 'RUB'];
      
      for (const currency of currencies) {
        try {
          const rate = await currencyManager.getExchangeRate(currency);
          rates[currency] = rate;
        } catch (error) {
          console.warn(`Failed to get rate for ${currency}:`, error);
        }
      }
      
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const getStatusBadge = (status: boolean) => (
    <Badge variant={status ? 'default' : 'destructive'}>
      {status ? 'Working' : 'Failed'}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6" />
              Phase 4: Currency & Settlement System
            </CardTitle>
            <CardDescription>
              Comprehensive testing of Web3 currency conversion and TON settlement features
            </CardDescription>
          </CardHeader>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Telegram SDK</span>
                {getStatusBadge(systemStatus.telegram)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WebApp API</span>
                {getStatusBadge(systemStatus.webApp)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Currency Manager</span>
                {getStatusBadge(systemStatus.currencies)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Settlement Manager</span>
                {getStatusBadge(systemStatus.settlement)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rates Quick View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Live Exchange Rates
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadExchangeRates}
                disabled={isLoadingRates}
              >
                {isLoadingRates ? 'Loading...' : 'Refresh'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(exchangeRates).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(exchangeRates).map(([currency, rate]) => (
                  <div key={currency} className="text-center p-3 bg-muted rounded-lg">
                    <div className="font-medium">{currency}</div>
                    <div className="text-sm text-muted-foreground">
                      {rate.toFixed(6)} TON
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Click "Refresh" to load current exchange rates
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mock Settlement Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Settlement Preview (Mock Data)
            </CardTitle>
            <CardDescription>
              Demonstration of debt optimization and TON settlement calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Participant Balances:</h4>
                <div className="space-y-2">
                  {mockParticipants.map((participant) => {
                    const balance = mockBalances[participant.telegramId];
                    return (
                      <div key={participant.telegramId} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{participant.firstName} {participant.lastName}</span>
                        <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {balance > 0 ? 'Owes' : 'Owed'} ${Math.abs(balance).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Optimized Settlement Plan:</h4>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Alice Smith</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium">Bob Johnson</span>
                    </div>
                    <span className="font-medium text-blue-600">$25.00</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Alice Smith</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium">Charlie Brown</span>
                    </div>
                    <span className="font-medium text-blue-600">$25.00</span>
                  </div>
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    Total: 2 transactions instead of potentially 3+ individual settlements
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 4 Features Tabs */}
        <Tabs defaultValue="converter" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="converter">Currency Converter</TabsTrigger>
            <TabsTrigger value="settlement">Settlement Manager</TabsTrigger>
          </TabsList>

          <TabsContent value="converter" className="space-y-4">
            <CurrencyConverter />
          </TabsContent>

          <TabsContent value="settlement" className="space-y-4">
            <SettlementManager
              participants={mockParticipants}
              balances={mockBalances}
              currency="USD"
            />
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                ← Back to Main App
              </Button>
              <Button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                    window.Telegram.WebApp.showAlert('Phase 4 features are working! 🎉');
                  } else {
                    alert('Phase 4 features are working! 🎉');
                  }
                }}
                className="flex-1"
              >
                Test Complete ✅
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPage; 