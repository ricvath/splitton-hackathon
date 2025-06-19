import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

interface WalletDebugInfoProps {
  className?: string;
}

const WalletDebugInfo: React.FC<WalletDebugInfoProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [injectedChecks, setInjectedChecks] = useState<Record<string, boolean>>({});

  const checkInjectedWallets = () => {
    const checks = {
      'window.tonkeeper': !!(window as any).tonkeeper,
      'window.ton': !!(window as any).ton,
      'window.tonwallet': !!(window as any).tonwallet,
      'window.ethereum': !!(window as any).ethereum,
      'navigator.userAgent': navigator.userAgent.includes('Telegram'),
    };
    setInjectedChecks(checks);
  };

  const loadWallets = async () => {
    setLoading(true);
    try {
      const { getTonConnectManager } = await import('../ton/connect');
      const manager = getTonConnectManager();
      await manager.init();
      const availableWallets = await manager.getWallets();
      setWallets(availableWallets);
      checkInjectedWallets();
    } catch (error) {
      console.error('Failed to load wallets:', error);
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadWallets();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="ghost"
        size="sm"
        className={`text-xs ${className}`}
      >
        <Eye className="w-3 h-3 mr-1" />
        Debug Wallet Info
      </Button>
    );
  }

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Wallet Debug Information</CardTitle>
            <CardDescription>
              Technical details for troubleshooting wallet connection issues
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadWallets}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Environment Checks */}
        <div>
          <h4 className="font-medium mb-2">Environment Checks</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {Object.entries(injectedChecks).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-mono text-xs">{key}</span>
                <Badge variant={value ? "default" : "secondary"}>
                  {value ? "✓ Available" : "✗ Not found"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Available Wallets */}
        <div>
          <h4 className="font-medium mb-2">
            Available Wallets ({wallets.length})
          </h4>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading wallets...</div>
          ) : wallets.length === 0 ? (
            <div className="text-sm text-muted-foreground">No wallets found</div>
          ) : (
            <div className="space-y-2">
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{wallet.name}</span>
                    <div className="flex gap-1">
                      <Badge variant={wallet.injected ? "default" : "outline"}>
                        {wallet.injected ? "Extension" : "Mobile/QR"}
                      </Badge>
                      {wallet.injected && (
                        <Badge variant={(window as any)[wallet.name.toLowerCase()] ? "default" : "destructive"}>
                          {(window as any)[wallet.name.toLowerCase()] ? "Detected" : "Not Found"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {wallet.bridgeUrl && (
                      <div>Bridge: {wallet.bridgeUrl}</div>
                    )}
                    {wallet.universalLink && (
                      <div>Universal Link: {wallet.universalLink}</div>
                    )}
                    {wallet.deepLink && (
                      <div>Deep Link: {wallet.deepLink}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium mb-2">Recommendations</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {!injectedChecks['window.tonkeeper'] && (
              <div>• Install Tonkeeper browser extension for best experience</div>
            )}
            {wallets.filter(w => w.injected).length === 0 && (
              <div>• No browser wallet extensions detected</div>
            )}
            {wallets.filter(w => !w.injected).length > 0 && (
              <div>• Mobile wallets available via QR code</div>
            )}
            {injectedChecks['navigator.userAgent'] && (
              <div>• Running in Telegram WebApp environment</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletDebugInfo; 