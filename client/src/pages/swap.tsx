import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { COIN_TICKER } from '@/lib/branding';

export default function Swap() {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'buy' | 'sell'>('buy');
  const [needsApproval, setNeedsApproval] = useState(false);
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();

  const swapMutation = useMutation({
    mutationFn: async (data: { type: 'buy' | 'sell'; amount: string; userId: string }) => {
      const response = await apiRequest('POST', `/api/swaps/${data.type}`, {
        userId: data.userId,
        amount: data.amount,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Swap Successful!',
        description: `Successfully ${swapDirection === 'buy' ? 'bought' : 'sold'} ${fromAmount} tokens.`,
      });
      setFromAmount('');
      setToAmount('');
    },
    onError: (error) => {
      toast({
        title: 'Swap Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Mock approval - in real app this would interact with smart contract
      return new Promise(resolve => setTimeout(resolve, 2000));
    },
    onSuccess: () => {
      setNeedsApproval(false);
      toast({
        title: 'Approval Successful!',
        description: `${COIN_TICKER} tokens have been approved for trading.`,
      });
    },
    onError: () => {
      toast({
        title: 'Approval Failed',
        description: `Failed to approve ${COIN_TICKER} tokens.`,
        variant: 'destructive',
      });
    },
  });

  const handleAmountChange = (value: string, isFrom: boolean) => {
    if (isFrom) {
      setFromAmount(value);
      setToAmount(value); // 1:1 ratio
    } else {
      setToAmount(value);
      setFromAmount(value); // 1:1 ratio
    }
  };

  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'buy' ? 'sell' : 'buy');
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = () => {
    if (!isConnected || !walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to proceed.',
        variant: 'destructive',
      });
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (swapDirection === 'sell' && needsApproval) {
      toast({
        title: 'Approval Required',
        description: `Please approve ${COIN_TICKER} tokens first.`,
        variant: 'destructive',
      });
      return;
    }

    swapMutation.mutate({
      type: swapDirection,
      amount: fromAmount,
      userId: walletAddress, // Using wallet address as user ID
    });
  };

  const fromToken = swapDirection === 'buy' ? 'USDT' : COIN_TICKER;
  const toToken = swapDirection === 'buy' ? COIN_TICKER : 'USDT';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Token Swap
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">Exchange USDT for {COIN_TICKER} at 1:1 ratio</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Token Exchange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Token */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">From</Label>
                <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-xl border border-border focus-within:border-primary transition-colors">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      fromToken === 'USDT' 
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                        : 'bg-gradient-to-r from-primary to-secondary'
                    }`}>
                      {fromToken === 'USDT' ? '$' : fromToken.charAt(0)}
                    </div>
                    <span className="font-semibold" data-testid="text-from-token">{fromToken}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value, true)}
                    className="bg-transparent border-none text-2xl font-bold text-right outline-none focus:ring-0 flex-2"
                    data-testid="input-from-amount"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSwapDirection}
                  className="neon-button p-3 rounded-full"
                  data-testid="button-swap-direction"
                >
                  <i className="fas fa-exchange-alt text-xl"></i>
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">To</Label>
                <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-xl border border-border">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      toToken === COIN_TICKER 
                        ? 'bg-gradient-to-r from-primary to-secondary' 
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    }`}>
                      {toToken === COIN_TICKER ? toToken.charAt(0) : '$'}
                    </div>
                    <span className="font-semibold" data-testid="text-to-token">{toToken}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => handleAmountChange(e.target.value, false)}
                    className="bg-transparent border-none text-2xl font-bold text-right outline-none focus:ring-0 flex-2"
                    data-testid="input-to-amount"
                  />
                </div>
              </div>

              {/* Rate Info */}
              <div className="flex justify-between items-center p-4 bg-muted/10 rounded-xl">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-semibold" data-testid="text-exchange-rate">1 USDT = 1 {COIN_TICKER}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleSwap}
                  disabled={swapMutation.isPending}
                  className="neon-button py-4 rounded-xl font-bold"
                  data-testid="button-buy-hica"
                >
                  {swapMutation.isPending ? 'Processing...' : `${swapDirection === 'buy' ? 'Buy' : 'Sell'} ${toToken}`}
                </Button>
                <Button
                  onClick={handleSwap}
                  disabled={swapMutation.isPending}
                  variant="outline"
                  className="glass-card py-4 rounded-xl font-bold border-border hover:border-primary transition-colors"
                  data-testid="button-sell-hica"
                >
                  {swapMutation.isPending ? 'Processing...' : `${swapDirection === 'sell' ? 'Buy' : 'Sell'} ${fromToken}`}
                </Button>
              </div>

              {/* Approval Notice */}
              {swapDirection === 'sell' && needsApproval && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <i className="fas fa-info-circle text-yellow-500"></i>
                    <span className="text-sm">First-time users need to approve {COIN_TICKER} token</span>
                  </div>
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 rounded-lg text-sm font-semibold"
                    data-testid="button-approve-hica"
                  >
                    {approveMutation.isPending ? 'Approving...' : `Approve ${COIN_TICKER}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
