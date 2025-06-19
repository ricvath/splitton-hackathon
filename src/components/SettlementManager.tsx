import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Wallet,
  ExternalLink 
} from 'lucide-react';
import { settlementManager, SettlementPlan, SettlementResult, SettlementProgress } from '../utils/settlementManager';
import { currencyManager } from '../utils/currencyManager';
import { useTonConnect } from '../hooks/useTonConnect';
import { CloudParticipant } from '../storage/types';
import { toast } from 'sonner';

interface SettlementManagerProps {
  balances: Record<string, number>;
  participants: CloudParticipant[];
  currency?: string;
  onSettlementComplete?: (results: SettlementResult[]) => void;
}

export const SettlementManager: React.FC<SettlementManagerProps> = ({
  balances,
  participants,
  currency = 'USD',
  onSettlementComplete,
}) => {
  const { isConnected, wallet } = useTonConnect();
  const [settlementPlan, setSettlementPlan] = useState<SettlementPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<SettlementProgress | null>(null);
  const [executionResults, setExecutionResults] = useState<SettlementResult[]>([]);
  const [estimatedFees, setEstimatedFees] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Generate settlement plan when data changes
  useEffect(() => {
    const generatePlan = async () => {
      setIsLoading(true);
      try {
        const plan = await settlementManager.createSettlementPlan(
          balances,
          participants,
          currency
        );
        setSettlementPlan(plan);

        // Estimate transaction fees and load current exchange rates
        if (plan.settlements.length > 0) {
          const fees = await settlementManager.estimateTransactionFees(plan);
          setEstimatedFees(fees);
        }

        // Load current exchange rates for display
        const rates: Record<string, number> = {};
        const currencies = ['USD', 'EUR', 'GBP', 'RUB'];
        for (const curr of currencies) {
          try {
            rates[curr] = await currencyManager.getExchangeRate(curr);
          } catch (error) {
            console.warn(`Failed to get rate for ${curr}:`, error);
          }
        }
        setExchangeRates(rates);
      } catch (error) {
        console.error('Failed to generate settlement plan:', error);
        toast.error('Failed to generate settlement plan');
      } finally {
        setIsLoading(false);
      }
    };

    if (Object.keys(balances).length > 0 && participants.length > 0) {
      generatePlan();
    }
  }, [balances, participants, currency]);

  const handleExecuteSettlements = async () => {
    if (!settlementPlan || !isConnected) return;

    setIsExecuting(true);
    setExecutionProgress(null);
    setExecutionResults([]);

    try {
      const results = await settlementManager.executeSettlementPlan(
        settlementPlan,
        (progress: SettlementProgress) => {
          setExecutionProgress(progress);
        }
      );

      setExecutionResults(results);
      onSettlementComplete?.(results);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        toast.success(`All ${successCount} settlements completed successfully!`);
      } else {
        toast.warning(`${successCount} settlements succeeded, ${failCount} failed`);
      }
    } catch (error) {
      console.error('Settlement execution failed:', error);
      toast.error('Failed to execute settlements');
    } finally {
      setIsExecuting(false);
    }
  };

  const getParticipantName = (telegramId: string): string => {
    const participant = participants.find(p => p.telegramId === telegramId);
    return participant?.username || `User ${telegramId}`;
  };

  const openTransactionInExplorer = (hash: string) => {
    window.open(`https://tonscan.org/tx/${hash}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Generating settlement plan...</span>
        </CardContent>
      </Card>
    );
  }

  if (!settlementPlan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <span className="text-muted-foreground">No settlement plan available</span>
        </CardContent>
      </Card>
    );
  }

  const summary = settlementManager.getSettlementSummary(settlementPlan);

  return (
    <div className="space-y-4">
      {/* Settlement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Settlement Plan
          </CardTitle>
          <CardDescription>
            Automated settlement using TON blockchain
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.totalAmount}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.participantsCount}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {currencyManager.formatAmount(estimatedFees, currency)}
              </div>
              <div className="text-sm text-muted-foreground">Est. Fees</div>
            </div>
          </div>

          {/* Issues/Warnings */}
          {summary.issues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {summary.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection Status */}
          {!isConnected && (
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Connect your TON wallet to execute settlements
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Settlement Details */}
      {settlementPlan.settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Transactions</CardTitle>
            <CardDescription>
              Individual transactions that will be executed
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {settlementPlan.settlements.map((settlement, index) => {
                const result = executionResults[index];
                
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {getParticipantName(
                            participants.find(p => p.walletAddress === settlement.from)?.telegramId || ''
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {settlement.from.slice(0, 8)}...{settlement.from.slice(-6)}
                        </div>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      
                      <div className="text-sm">
                        <div className="font-medium">
                          {getParticipantName(
                            participants.find(p => p.walletAddress === settlement.to)?.telegramId || ''
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {settlement.to.slice(0, 8)}...{settlement.to.slice(-6)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {currencyManager.formatAmount(settlement.amountFiat, settlement.currency)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {settlement.amountTon.toFixed(4)} TON
                        </div>
                      </div>

                      {result && (
                        <div className="flex items-center gap-1">
                          {result.success ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {result.transactionHash && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openTransactionInExplorer(result.transactionHash!)}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <div title={result.error}>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Progress */}
      {isExecuting && executionProgress && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Executing Settlements</span>
                <Badge variant={
                  executionProgress.status === 'completed' ? 'default' :
                  executionProgress.status === 'failed' ? 'destructive' :
                  'secondary'
                }>
                  {executionProgress.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{executionProgress.completed} / {executionProgress.total}</span>
                </div>
                <Progress 
                  value={(executionProgress.completed / executionProgress.total) * 100} 
                  className="w-full" 
                />
              </div>

              {executionProgress.currentSettlement && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium mb-1">Current Transaction:</div>
                  <div className="text-xs text-muted-foreground">
                    {currencyManager.formatAmount(
                      executionProgress.currentSettlement.amountFiat, 
                      executionProgress.currentSettlement.currency
                    )} ({executionProgress.currentSettlement.amountTon.toFixed(4)} TON)
                  </div>
                </div>
              )}

              {executionProgress.results.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Transaction Results:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {executionProgress.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                        <span>Transaction #{index + 1}</span>
                        <div className="flex items-center gap-1">
                          {result.success ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">Success</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-red-600">Failed</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Advanced Settings</CardTitle>
              <CardDescription>Currency conversion and settlement options</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="space-y-4">
            <Separator />
            
            {/* Currency Rates */}
            <div>
              <h4 className="font-medium mb-2">Current Exchange Rates</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>1 USD =</span>
                  <span>{(1 / (exchangeRates.USD || 1)).toFixed(6)} TON</span>
                </div>
                <div className="flex justify-between">
                  <span>1 EUR =</span>
                  <span>{(1 / (exchangeRates.EUR || 1)).toFixed(6)} TON</span>
                </div>
                <div className="flex justify-between">
                  <span>1 GBP =</span>
                  <span>{(1 / (exchangeRates.GBP || 1)).toFixed(6)} TON</span>
                </div>
                <div className="flex justify-between">
                  <span>1 RUB =</span>
                  <span>{(1 / (exchangeRates.RUB || 1)).toFixed(6)} TON</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Settlement Validation */}
            <div>
              <h4 className="font-medium mb-2">Settlement Validation</h4>
              <div className="space-y-2 text-sm">
                                 <div className="flex items-center justify-between">
                   <span>Plan Valid:</span>
                   <Badge variant="secondary">
                     Checking...
                   </Badge>
                 </div>
                <div className="flex items-center justify-between">
                  <span>All Wallets Connected:</span>
                  <Badge variant={settlementPlan.missingWallets.length === 0 ? 'default' : 'destructive'}>
                    {settlementPlan.missingWallets.length === 0 ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated Gas:</span>
                  <span>{currencyManager.formatAmount(estimatedFees, currency)}</span>
                </div>
              </div>
            </div>

            {/* Missing Wallets */}
            {settlementPlan.missingWallets.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Missing Wallet Connections</h4>
                  <div className="space-y-1">
                    {settlementPlan.missingWallets.map((telegramId) => (
                      <div key={telegramId} className="text-sm text-muted-foreground">
                        • {getParticipantName(telegramId)}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Execute Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleExecuteSettlements}
          disabled={!summary.readyToExecute || isExecuting || !isConnected}
          size="lg"
          className="w-full max-w-md"
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing Settlements...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Execute {summary.totalTransactions} Settlement{summary.totalTransactions !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 