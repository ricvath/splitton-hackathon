import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Wallet, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useTonConnect } from '../hooks/useTonConnect';
import { toast } from 'sonner';

interface TonWalletConnectProps {
  onWalletConnected?: (address: string) => void;
  showBalance?: boolean;
  compact?: boolean;
}

export const TonWalletConnect: React.FC<TonWalletConnectProps> = ({
  onWalletConnected,
  showBalance = true,
  compact = false,
}) => {
  const {
    wallet,
    isConnected,
    isConnecting,
    error,
    balance,
    balanceUsd,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    formatAddress,
  } = useTonConnect();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success && wallet?.address) {
      onWalletConnected?.(wallet.address);
      toast.success('Wallet connected successfully!');
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    toast.info('Wallet disconnected');
  };

  const handleCopyAddress = async () => {
    if (wallet?.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        toast.success('Address copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy address');
      }
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
    toast.success('Balance refreshed');
  };

  const openInExplorer = () => {
    if (wallet?.address) {
      window.open(`https://tonscan.org/address/${wallet.address}`, '_blank');
    }
  };

  if (compact && isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Wallet className="h-3 w-3" />
          {formatAddress(wallet?.address || '')}
        </Badge>
        {showBalance && (
          <Badge variant="outline" className="flex items-center gap-1">
            {balance} TON
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          TON Wallet
        </CardTitle>
        <CardDescription>
          {isConnected 
            ? 'Your wallet is connected and ready for settlements'
            : 'Connect your TON wallet to enable cryptocurrency settlements'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Wallet Address */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Address</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatAddress(wallet?.address || '')}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInExplorer}
                  title="View in explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Balance Display */}
            {showBalance && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{balance} TON</span>
                    <span className="text-sm text-muted-foreground">{balanceUsd}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                  title="Refresh balance"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}

            {/* Disconnect Button */}
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-center">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}; 