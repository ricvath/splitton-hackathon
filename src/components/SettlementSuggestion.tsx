import { TonConnectButton, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Zap, Copy, ExternalLink } from 'lucide-react';
import { DebtResult } from '@/hooks/useLocalExpenses';
import { useTelegram } from '@/hooks/useTelegram';
import { useState } from 'react';

interface SettlementSuggestionProps {
  debts: DebtResult[];
  totalExpenses: number;
  participantCount: number;
}

export const SettlementSuggestion = ({ debts, totalExpenses, participantCount }: SettlementSuggestionProps) => {
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress();
  const { hapticFeedback, shareApp } = useTelegram();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = async () => {
    if (userFriendlyAddress) {
      await navigator.clipboard.writeText(userFriendlyAddress);
      setCopiedAddress(true);
      hapticFeedback('success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleSendPayment = (debt: DebtResult) => {
    hapticFeedback('light');
    // For hackathon - this would integrate with TON payment
    alert(`Demo: Send $${debt.amount.toFixed(2)} to ${debt.to} via TON wallet 🚀`);
  };

  if (debts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-green-100 rounded-full">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-green-800">All Settled Up! 🎉</CardTitle>
          <CardDescription className="text-green-600">
            No outstanding balances. Time to plan your next adventure!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={shareApp} className="bg-green-600 hover:bg-green-700">
            📱 Share SplitTON with Friends
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            💰 Ready to Settle?
          </CardTitle>
          <CardDescription>
            {totalExpenses > 0 && (
              <>Total expenses: <span className="font-semibold">${totalExpenses.toFixed(2)}</span> • {participantCount} people</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!wallet ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Connect your TON wallet to see settlement options:
                    </p>
                    <div className="mb-3">
                      <TonConnectButton />
                    </div>
                    <p className="text-xs text-blue-700">
                      ✨ New to crypto? No worries! We'll guide you through setting up your first wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Pending settlements:</p>
                {debts.map((debt, index) => (
                  <div key={`${debt.from}-${debt.to}-${index}`} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{debt.from}</span> owes{' '}
                          <span className="font-medium">{debt.to}</span>
                        </p>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        ${debt.amount.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-full">
                      <Wallet className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-800">
                      Wallet connected
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                      {userFriendlyAddress?.slice(0, 8)}...{userFriendlyAddress?.slice(-6)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyAddress}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className={`h-3 w-3 ${copiedAddress ? 'text-green-600' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Settlement suggestions:</p>
                  <Badge variant="outline" className="text-xs">
                    {debts.length} transaction{debts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {debts.map((debt, index) => (
                  <Card key={`${debt.from}-${debt.to}-${index}`} className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            <span className="text-blue-600">{debt.from}</span> → {debt.to}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ${debt.amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleSendPayment(debt)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Send via TON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://tonkeeper.com/', '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open Tonkeeper
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        💡 Send directly to their TON wallet address or use @username if they have one
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-2 border-t">
                <Button onClick={shareApp} variant="outline" className="w-full">
                  📱 Share SplitTON with Friends
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!wallet && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Why TON? ⚡
                </p>
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>• Fast & cheap transactions</li>
                  <li>• Native to Telegram ecosystem</li>
                  <li>• Easy wallet setup</li>
                  <li>• Perfect for group payments</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 