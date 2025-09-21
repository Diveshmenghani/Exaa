import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import StakingCalculator from '@/components/staking-calculator';

export default function Stake() {
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();
  const [calculationData, setCalculationData] = useState<{
    amount: string;
    lockPeriod: number;
    referralLevel: number;
    monthlyRewards: number;
    totalRewards: number;
  } | null>(null);

  const stakeMutation = useMutation({
    mutationFn: async (data: { amount: string; lockPeriodMonths: number; userId: string }) => {
      const response = await apiRequest('POST', '/api/stakes', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Staking Successful!',
        description: `Successfully staked ${calculationData?.amount} HICA for ${calculationData?.lockPeriod} months.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stakes'] });
    },
    onError: (error) => {
      toast({
        title: 'Staking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleStake = () => {
    if (!isConnected || !walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to proceed.',
        variant: 'destructive',
      });
      return;
    }

    if (!calculationData || !calculationData.amount || parseFloat(calculationData.amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid stake amount.',
        variant: 'destructive',
      });
      return;
    }

    stakeMutation.mutate({
      amount: calculationData.amount,
      lockPeriodMonths: calculationData.lockPeriod,
      userId: walletAddress,
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Staking Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Calculate your rewards based on stake amount, lock period, and referral level
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <StakingCalculator onCalculationChange={setCalculationData} />
          
          {/* Stake Action */}
          <div className="mt-8 text-center">
            <Button
              onClick={handleStake}
              disabled={stakeMutation.isPending || !isConnected}
              className="neon-button px-12 py-4 rounded-xl text-lg font-bold"
              data-testid="button-stake-tokens"
            >
              {stakeMutation.isPending ? 'Staking...' : 'Stake Tokens'}
            </Button>
            {!isConnected && (
              <p className="text-muted-foreground mt-4">Connect your wallet to start staking</p>
            )}
          </div>

          {/* Staking Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="glass-card text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <i className="fas fa-shield-alt text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
                <p className="text-muted-foreground text-sm">
                  Your staked tokens are secured by smart contracts with emergency unstake protection.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">High Returns</h3>
                <p className="text-muted-foreground text-sm">
                  Earn up to 15% monthly returns based on your lock period and referral network.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Referral Bonuses</h3>
                <p className="text-muted-foreground text-sm">
                  Build your network and earn additional rewards from your referral tree.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
