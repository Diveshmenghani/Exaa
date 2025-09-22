import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Stake() {
  const { toast } = useToast();
  const { walletAddress, isConnected, connect } = useWallet();
  const { stake, approveTokens, approveAndStake, isLoading, error } = useContract();
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState([12]); // Slider uses array format
  const [referrerAddress, setReferrerAddress] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Calculate APY based on lock period
  const calculateAPY = (months: number) => {
    if (months >= 36) return 18; // 3 years = 18%
    if (months >= 24) return 15; // 2 years = 15%
    if (months >= 12) return 12; // 1 year = 12%
    return 10; // Less than 1 year = 10%
  };

  // Calculate estimated rewards
  const calculateRewards = () => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) return 0;
    const amount = parseFloat(stakeAmount);
    const apy = calculateAPY(lockPeriod[0]);
    const monthlyReward = (amount * apy) / 100;
    return monthlyReward * lockPeriod[0];
  };

  // Real API calls for user data and stats
  const { data: userBalance } = useQuery({
    queryKey: ['userBalance', walletAddress],
    queryFn: async () => {
      // Calculate balance from user's total staked and earned
      try {
        const userResponse = await apiRequest('GET', `/api/users/${walletAddress}`);
        const userData = await userResponse.json();
        const totalBalance = parseFloat(userData.totalEarned || '0') + parseFloat(userData.referralEarnings || '0');
        return { balance: totalBalance, usdValue: totalBalance.toFixed(2) };
      } catch {
        return { balance: 0, usdValue: '0.00' };
      }
    },
    enabled: !!walletAddress
  });

  const { data: userStakes } = useQuery({
    queryKey: ['userStakes', walletAddress],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/stakes/user/${walletAddress}`);
      const data = await response.json();
      // Add hasReferrer property based on existing data
      return {
        ...data,
        hasReferrer: data.referrer && data.referrer !== '0x0000000000000000000000000000000000000000'
      };
    },
    enabled: !!walletAddress
  });

  // Remove stakingStats query - no longer needed

  const stakeMutation = useMutation({
    mutationFn: async (data: { amount: string; lockYears: number; referrer: string }) => {
      // Use the combined approveAndStake function
      const success = await approveAndStake(data.amount, data.lockYears, data.referrer);
      
      if (!success) {
        throw new Error('Failed to complete staking process');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Staking Successful!',
        description: `Successfully staked ${stakeAmount} HICA for ${Math.ceil(lockPeriod[0]/12)} years.`,
      });
      setStakeAmount('');
      setReferrerAddress('');
      queryClient.invalidateQueries({ queryKey: ['userStakes', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['userBalance', walletAddress] });
    },
    onError: (error: any) => {
      toast({
        title: 'Staking Failed',
        description: error.message || 'An error occurred while staking',
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
      connect();
      return;
    }
    
    // Validate stake amount (must be a positive number)
    if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid stake amount (must be a positive number).',
        variant: 'destructive',
      });
      return;
    }
    
    // Convert months to years for the contract (rounding up)
    const lockYears = Math.ceil(lockPeriod[0] / 12);
    
    // Validate lock period (must be at least 1 month)
    if (lockPeriod[0] < 1) {
      toast({
        title: 'Invalid Lock Period',
        description: 'Lock period must be at least 1 month.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate referrer address if provided
    let referrer = '0x0000000000000000000000000000000000000000';
    if (referrerAddress) {
      try {
        // Check if it's a valid Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(referrerAddress)) {
          toast({
            title: 'Invalid Referrer Address',
            description: 'Please enter a valid Ethereum address or leave it empty.',
            variant: 'destructive',
          });
          return;
        }
        referrer = referrerAddress;
      } catch (error) {
        toast({
          title: 'Invalid Referrer Address',
          description: 'Please enter a valid Ethereum address or leave it empty.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // All validations passed, proceed with staking
    stakeMutation.mutate({
      amount: stakeAmount.trim(),
      lockYears: lockYears,
      referrer: referrer
    });
  };

  // Unstake mutation
  const unstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      const response = await apiRequest('POST', `/api/stakes/${stakeId}/unstake`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Unstaking Successful!',
        description: 'Your tokens have been unstaked and rewards claimed.',
      });
      queryClient.invalidateQueries({ queryKey: ['userStakes', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['userBalance', walletAddress] });
    },
    onError: (error) => {
      toast({
        title: 'Unstaking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // handleUnstake function removed - now handled per-item in unstake tab

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Main Staking Interface */}
        <Card className="glass-card mb-8">
          <CardContent className="p-8">
            {/* Tabs */}
            <Tabs defaultValue="stake" className="w-full">
              <TabsList className="grid grid-cols-2 mb-8 bg-muted/20">
                <TabsTrigger value="stake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-stake">
                  <span className="text-lg">Stake</span>
                </TabsTrigger>
                <TabsTrigger value="unstake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-unstake">
                  <span className="text-lg">Unstake</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stake" className="space-y-6">
                {/* Balance Display */}
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-muted-foreground mb-2" data-testid="balance-amount">
                    {userBalance?.balance || 0}
                  </div>
                  <div className="text-xl text-muted-foreground">
                    $ {userBalance?.usdValue || '0.00'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">HICA</div>
                </div>

                {/* Stake Amount Input */}
                <div className="space-y-4 mb-6">
                  <Label htmlFor="stake-amount" className="text-lg font-semibold">Stake Amount</Label>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="Enter amount to stake"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="text-center text-2xl h-16 bg-white/90 dark:bg-gray-800 border-2 border-primary/50 focus:border-primary"
                    data-testid="input-stake-amount"
                  />
                </div>

                {/* Lock Period Slider */}
                <div className="space-y-4 mb-6">
                  <Label className="text-lg font-semibold">Lock Period: {lockPeriod[0]} months ({Math.floor(lockPeriod[0] / 12)} year{Math.floor(lockPeriod[0] / 12) !== 1 ? 's' : ''})</Label>
                  <Slider
                    value={lockPeriod}
                    onValueChange={setLockPeriod}
                    min={12}
                    max={36}
                    step={12}
                    className="w-full"
                    data-testid="slider-lock-period"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 year</span>
                    <span>2 years</span>
                    <span>3 years</span>
                  </div>
                </div>

                {/* Reward Calculation */}
                <div className="text-center mb-8 p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="text-sm font-medium mb-2">Estimated Rewards</div>
                  <div className="text-2xl font-bold text-primary" data-testid="estimated-rewards">
                    {calculateRewards().toLocaleString()} HICA
                  </div>
                  <div className="text-sm font-medium mt-1">
                    APY: <span className="text-primary font-bold">{calculateAPY(lockPeriod[0])}%</span> monthly
                  </div>
                </div>

                {/* Connect/Stake Button with Conditional Referral */}
                <div className="mb-8">
                  {!isConnected ? (
                    <div className="flex justify-center">
                      <Button
                        onClick={connect}
                        className="neon-button px-32 py-4 rounded-xl text-lg font-bold"
                        data-testid="button-connect-wallet"
                      >
                        Connect
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Conditional Referral Input - Only show if user doesn't have a referrer */}
                      {!userStakes?.hasReferrer && (
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 mb-4">
                          <Label htmlFor="referrer" className="text-sm font-medium mb-2 block">Add Referrer (Optional)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="referrer"
                              placeholder="Enter referrer address"
                              value={referrerAddress}
                              onChange={(e) => setReferrerAddress(e.target.value)}
                              className="flex-1 h-10 bg-white/90 dark:bg-gray-800 border-primary/30"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Stake Button */}
                      <Button
                        onClick={handleStake}
                        disabled={stakeMutation.isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="neon-button w-full py-4 rounded-xl text-lg font-bold"
                        data-testid="button-stake-tokens"
                      >
                        {stakeMutation.isPending ? 'Staking...' : 'Stake HICA'}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="unstake" className="space-y-6">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <Button
                      onClick={connect}
                      className="neon-button px-32 py-4 rounded-xl text-lg font-bold"
                      data-testid="button-connect-wallet-unstake"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Stakes List */}
                    {userStakes && userStakes.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-center mb-6">Your Active Stakes</h3>
                        {userStakes.map((stake: any) => (
                          <div key={stake.id} className="p-4 bg-muted/10 rounded-lg border border-border" data-testid={`stake-item-${stake.id}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold">{parseFloat(stake.amount).toLocaleString()} HICA</span>
                              <span className={`px-2 py-1 rounded text-xs ${stake.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {stake.isActive ? 'Active' : 'Completed'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                              Lock Period: {stake.lockPeriodMonths} months • APY: {stake.apy || calculateAPY(stake.lockPeriodMonths)}%
                            </div>
                            {stake.canUnstake && stake.isActive && (
                              <Button
                                onClick={() => unstakeMutation.mutate(stake.id)}
                                disabled={unstakeMutation.isPending}
                                variant="outline"
                                className="w-full py-2 border-primary/50 hover:border-primary"
                                data-testid={`button-unstake-${stake.id}`}
                              >
                                {unstakeMutation.isPending ? 'Unstaking...' : 'Unstake'}
                              </Button>
                            )}
                            {!stake.canUnstake && stake.isActive && (
                              <div className="text-center text-sm text-muted-foreground">
                                Cannot unstake yet - lock period not completed
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-4">No active stakes found</div>
                        <div className="text-sm text-muted-foreground">Start staking to see your stakes here</div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
