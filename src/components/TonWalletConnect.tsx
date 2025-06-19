import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Wallet, Copy, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
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
    try {
      const success = await connectWallet();
      if (success && wallet?.address) {
        onWalletConnected?.(wallet.address);
        toast.success('Wallet connected successfully!');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      toast.info('Wallet disconnected');
    } catch (err) {
      console.error('Wallet disconnection error:', err);
      toast.error('Failed to disconnect wallet');
    }
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
    try {
      setIsRefreshing(true);
      await refreshBalance();
      setIsRefreshing(false);
      toast.success('Balance refreshed');
    } catch (err) {
      setIsRefreshing(false);
      toast.error('Failed to refresh balance');
    }
  };

  const openInExplorer = () => {
    if (wallet?.address) {
      window.open(`https://tonscan.org/address/${wallet.address}`, '_blank');
    }
  };

  // Show error state if TON Connect is not available
  if (error?.includes('TON Connect not available')) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            TON Wallet (Unavailable)
          </CardTitle>
          <CardDescription>
            TON Connect is currently unavailable. This may be due to network issues or browser compatibility.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              TON wallet functionality is temporarily unavailable. You can still use the app for expense tracking, 
              but cryptocurrency settlements won't be available.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
        {error && !error.includes('TON Connect not available') && (
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

        {/* Development Notice */}
        <div className="text-xs text-muted-foreground text-center">
          TON Connect integration for secure wallet connections
        </div>
      </CardContent>
    </Card>
  );
}; 