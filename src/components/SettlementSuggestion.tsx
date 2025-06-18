import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTelegram } from '../hooks/useTelegram';

interface SettlementSuggestionProps {
  balances: Record<string, number>;
}

export const SettlementSuggestion = ({ balances }: SettlementSuggestionProps) => {
  const [tonConnectUI] = useTonConnectUI();
  const { hapticFeedback, isInTelegram } = useTelegram();
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  
  const connected = tonConnectUI.connected;
  const wallet = tonConnectUI.account;

  // Calculate settlement suggestions
  const calculateSettlements = () => {
    // Ensure balances is not null or undefined
    if (!balances || typeof balances !== 'object') {
      console.warn('Invalid balances object:', balances);
      return [];
    }
    
    const settlements: { from: string; to: string; amount: number }[] = [];
    
    try {
      // Separate debtors and creditors
      const debtors = Object.entries(balances)
        .filter(([_, balance]) => balance < 0)
        .sort((a, b) => a[1] - b[1]); // Sort by amount (ascending)
      
      const creditors = Object.entries(balances)
        .filter(([_, balance]) => balance > 0)
        .sort((a, b) => b[1] - a[1]); // Sort by amount (descending)
      
      let debtorIndex = 0;
      let creditorIndex = 0;
      
      while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const [debtorName, debtorBalance] = debtors[debtorIndex];
        const [creditorName, creditorBalance] = creditors[creditorIndex];
        
        const debtAmount = Math.abs(debtorBalance);
        const creditAmount = creditorBalance;
        
        const transferAmount = Math.min(debtAmount, creditAmount);
        
        if (transferAmount > 0.01) { // Ignore tiny transfers
          settlements.push({
            from: debtorName,
            to: creditorName,
            amount: parseFloat(transferAmount.toFixed(2))
          });
        }
        
        // Update balances
        debtors[debtorIndex] = [debtorName, debtorBalance + transferAmount];
        creditors[creditorIndex] = [creditorName, creditorBalance - transferAmount];
        
        // Move to next person if their balance is settled
        if (Math.abs(debtors[debtorIndex][1]) < 0.01) debtorIndex++;
        if (Math.abs(creditors[creditorIndex][1]) < 0.01) creditorIndex++;
      }
    } catch (error) {
      console.error('Error calculating settlements:', error);
    }
    
    return settlements;
  };

  const settlements = calculateSettlements();

  const handleConnectWallet = () => {
    hapticFeedback('medium');
    tonConnectUI.openModal();
  };

  const handleDisconnectWallet = () => {
    hapticFeedback('medium');
    tonConnectUI.disconnect();
  };

  const handleToggleWalletInfo = () => {
    setShowWalletInfo(!showWalletInfo);
    hapticFeedback('light');
  };

  const formatTonAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Settle Up with TON</CardTitle>
        <CardDescription>
          Pay your friends using TON cryptocurrency
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settlements.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {settlements.map((settlement, index) => (
                <div key={index} className="p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{settlement.from} pays {settlement.to}</p>
                      <p className="text-sm text-muted-foreground">
                        {settlement.amount.toFixed(2)} TON
                      </p>
                    </div>
                    {connected && (
                      <Button size="sm" variant="outline" onClick={handleToggleWalletInfo}>
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!connected ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Connect your TON wallet to settle expenses with cryptocurrency.
                </p>
                <Button onClick={handleConnectWallet} className="w-full">
                  Connect TON Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTonAddress(wallet?.address || '')}
                  </p>
                </div>
                {showWalletInfo && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">How to pay with TON</p>
                    <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1 mt-2">
                      <li>Open your TON wallet app (Tonkeeper, Tonhub, etc.)</li>
                      <li>Send the specified amount to your friend</li>
                      <li>Come back here and mark the payment as complete</li>
                    </ol>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleDisconnectWallet} 
                  className="w-full text-sm"
                >
                  Disconnect Wallet
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            No settlements needed at this time
          </p>
        )}
      </CardContent>
    </Card>
  );
}; 