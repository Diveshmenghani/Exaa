import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import StakingCalculator from '@/components/staking-calculator';
import { ChevronDown } from 'lucide-react';

export default function Stake() {
  const { toast } = useToast();
  const { walletAddress, isConnected, connect } = useWallet();
  const [selectedToken, setSelectedToken] = useState('HICA');
  const [activeTab, setActiveTab] = useState('stake');
  const [calculationData, setCalculationData] = useState<{
    amount: string;
    lockPeriod: number;
    referralLevel: number;
    monthlyRewards: number;
    totalRewards: number;
  } | null>(null);

  // Mock data for demonstration - replace with real API calls
  const { data: userBalance } = useQuery({
    queryKey: ['userBalance', walletAddress],
    queryFn: () => ({ balance: 0, usdValue: '0.00' }),
    enabled: !!walletAddress
  });

  const { data: stakingStats } = useQuery({
    queryKey: ['stakingStats'],
    queryFn: () => ({
      apy: { min: 2.49, max: 5.51 },
      totalValueLocked: '314.14k',
      totalStakers: '83,247'
    })
  });

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
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Main Staking Interface */}
        <Card className="glass-card mb-8">
          <CardContent className="p-8">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8 bg-muted/20">
                <TabsTrigger value="stake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <span className="text-lg">Stake</span>
                </TabsTrigger>
                <TabsTrigger value="boost" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <span className="text-lg">Boost</span>
                </TabsTrigger>
                <TabsTrigger value="balance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <span className="text-lg">Balance</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stake" className="space-y-6">
                {/* Balance Display */}
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-muted-foreground mb-2">
                    {userBalance?.balance || 0}
                  </div>
                  <div className="text-xl text-muted-foreground">
                    $ {userBalance?.usdValue || '0.00'}
                  </div>
                </div>

                {/* Token Selector */}
                <div className="flex justify-center mb-6">
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger className="w-32 bg-muted/20 border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                        <SelectValue />
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="HICA">HICA</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Connect/Action Button */}
                <div className="flex justify-center mb-8">
                  {!isConnected ? (
                    <Button
                      onClick={connect}
                      className="neon-button px-32 py-4 rounded-xl text-lg font-bold"
                      data-testid="button-connect-wallet"
                    >
                      Connect
                    </Button>
                  ) : (
                    <div className="space-y-4 w-full">
                      <Button
                        onClick={handleStake}
                        disabled={stakeMutation.isPending}
                        className="neon-button w-full py-4 rounded-xl text-lg font-bold"
                        data-testid="button-stake-tokens"
                      >
                        {stakeMutation.isPending ? 'Staking...' : 'Stake Tokens'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full py-4 rounded-xl text-lg font-bold border-primary/50 hover:border-primary"
                        data-testid="button-unstake-tokens"
                      >
                        Unstake
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Annual percentage yield</div>
                    <div className="text-lg font-bold text-primary">
                      {stakingStats?.apy.min}% - {stakingStats?.apy.max}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Total value locked</div>
                    <div className="text-lg font-bold">
                      {stakingStats?.totalValueLocked} {selectedToken}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Stakers</div>
                    <div className="text-lg font-bold">
                      {stakingStats?.totalStakers}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="boost" className="text-center py-8">
                <div className="text-muted-foreground">Boost features coming soon...</div>
              </TabsContent>

              <TabsContent value="balance" className="text-center py-8">
                <div className="text-muted-foreground">Balance details coming soon...</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Reward Calculator Section */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Reward Calculator
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StakingCalculator onCalculationChange={setCalculationData} />
          </CardContent>
        </Card>

        {/* Staking Benefits */}
        <div className="grid md:grid-cols-3 gap-6">
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
  );
}
