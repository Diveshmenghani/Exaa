import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClientMock';
import { COIN_TICKER } from '@/lib/branding';
import { ethers } from 'ethers';

export default function Stake() {
  const { toast } = useToast();
  
  const { walletAddress, isConnected, connect } = useWallet();
  const { approveAndStake, unstake, getUserStakes, isLoading, error } = useContract();
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState([12]); // Slider uses array format
  const [referrerAddress, setReferrerAddress] = useState('');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationReferrer, setValidationReferrer] = useState('');

  // Calculate APY based on lock period (in years)
  const calculateAPY = (years: number) => {
    if (years === 1) return 10;
    if (years === 2) return 12;
    if (years === 3) return 15;
    return 10;
  };

  // Calculate estimated rewards
  const calculateRewards = () => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) return 0;
    const amount = parseFloat(stakeAmount);
    const apy = calculateAPY(lockPeriod[0]);
    const monthlyReward = (amount * apy) / 100;
    return monthlyReward * lockPeriod[0] * 12; // Convert years to months for total calculation
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
      try {
        const response = await apiRequest('GET', `/api/stakes/user/${walletAddress}`);
        const data = await response.json();
        // Add hasReferrer property based on existing data
        return {
          ...data,
          hasReferrer: data.referrer && data.referrer !== '0x0000000000000000000000000000000000000000'
        };
      } catch (error: any) {
        // If user not found (404), return empty stakes data
        if (error.status === 404 || error.message?.includes('User not found')) {
          return {
            stakes: [],
            hasReferrer: false,
            referrer: null
          };
        }
        throw error; // Re-throw other errors
      }
    },
    enabled: !!walletAddress
  });

  // Remove stakingStats query - no longer needed

  const stakeMutation = useMutation({
    mutationFn: async (data: { amount: string; lockYears: number; referrer: string }) => {
      // Use the approveAndStake function to handle both approval and staking
      const success = await approveAndStake(data.amount, data.lockYears, data.referrer);
      
      if (!success) {
        throw new Error('Failed to complete staking process');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Staking Successful!',
        description: `Successfully staked ${stakeAmount} ${COIN_TICKER} for ${lockPeriod[0]} year${lockPeriod[0] !== 1 ? 's' : ''}.`,
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
    
    // Validate lock period (must be at least 1 month)
    if (lockPeriod[0] < 1) {
      toast({
        title: 'Invalid Lock Period',
        description: 'Lock period must be at least 1 Year.',
        variant: 'destructive',
      });
      return;
    }
    
    // Set initial referrer for validation dialog
    setValidationReferrer(referrerAddress);
    
    // Show validation dialog
    setShowValidationDialog(true);
  };

  const handleConfirmStake = () => {
    // Validate referrer address if provided
    let referrer = '0x0000000000000000000000000000000000000000';
    if (validationReferrer) {
      try {
        // Check if it's a valid Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(validationReferrer)) {
          toast({
            title: 'Invalid Referrer Address',
            description: 'Please enter a valid Ethereum address or leave it empty.',
            variant: 'destructive',
          });
          return;
        }
        referrer = validationReferrer;
      } catch (error) {
        toast({
          title: 'Invalid Referrer Address',
          description: 'Please enter a valid Ethereum address or leave it empty.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Use the lock period directly as it's already in years
    const lockYears = lockPeriod[0];
    
    // Close dialog and proceed with staking
    setShowValidationDialog(false);
    stakeMutation.mutate({
      amount: stakeAmount.trim(),
      lockYears: lockYears,
      referrer: referrer
    });
  };

  // Helper function to find stake index in blockchain
  const findStakeIndex = async (dbStake: any): Promise<number> => {
    if (!walletAddress) throw new Error('Wallet not connected');
    
    const blockchainStakes = await getUserStakes(walletAddress);
    
    // Match by amount and approximate timestamp
    const dbAmount = parseFloat(dbStake.amount);
    const dbTimestamp = new Date(dbStake.startDate).getTime();
    
    for (let i = 0; i < blockchainStakes.length; i++) {
      const blockchainStake = blockchainStakes[i];
      const blockchainAmount = parseFloat(ethers.utils.formatEther(blockchainStake.amount));
      
      // Match by amount (with small tolerance for precision differences)
      if (Math.abs(blockchainAmount - dbAmount) < 0.001) {
        return i;
      }
    }
    
    throw new Error('Could not find matching stake in blockchain');
  };

  // Unstake mutation
  const unstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      // First get the stake from our query data to find the index
      const stakes = userStakes.data?.stakes || [];
      const dbStake = stakes.find((s: any) => s.id === stakeId);
      if (!dbStake) {
        throw new Error('Stake not found');
      }
      
      // Find the corresponding stake index in the blockchain
      const stakeIndex = await findStakeIndex(dbStake);
      
      // Call the blockchain contract to unstake
      const contractSuccess = await unstake(stakeIndex);
      if (!contractSuccess) {
        throw new Error('Failed to unstake from blockchain contract');
      }
      
      // Then update the database
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
    <div className="min-h-screen pt-40 pb-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Page Heading */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">
              Stake
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">Stake your tokens and earn rewards</p>
        </div>

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
                {/* Stake Amount Display/Input */}
                <div className="text-center mb-8 p-6 bg-primary/10 rounded-xl ">
                  <div className="text-sm font-medium mb-2">Amount to Stake</div>
                  {isEditingAmount ? (
                    <div className="flex items-center justify-center space-x-2">
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        onBlur={() => setIsEditingAmount(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingAmount(false);
                          }
                        }}
                        className="text-4xl font-bold text-center bg-transparent border-none outline-none text-primary w-64"
                        data-testid="input-stake-amount"
                        autoFocus
                      />
                      <span className="text-2xl text-muted-foreground">{COIN_TICKER}</span>
                    </div>
                  ) : (
                    <div 
                      className="text-4xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors"
                      onClick={() => setIsEditingAmount(true)}
                      data-testid="display-stake-amount"
                    >
                      {stakeAmount || '0'} <span className="text-2xl text-muted-foreground">{COIN_TICKER}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-2">Click to edit amount</div>
                </div>

                {/* Stake Button - Moved here under amount input */}
                <div className="mb-8">
                  {!isConnected ? (
                    <div className="flex justify-center">
                      <Button
                        onClick={connect}
                        className="neon-button w-3/4 py-6 rounded-xl text-lg font-bold"
                        data-testid="button-connect-wallet"
                      >
                        Connect
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleStake}
                        disabled={stakeMutation.isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="neon-button w-3/4 py-6 rounded-xl text-lg font-bold"
                        data-testid="button-stake-tokens"
                      >
                        {stakeMutation.isPending ? 'Staking...' : `Stake ${COIN_TICKER}`}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Lock Period Slider */}
                <div className="space-y-6 mb-8 p-6 bg-muted/10 rounded-xl">
                  <div className="text-center">
                    <Label className="text-lg font-semibold block mb-2">
                      Lock Period: {lockPeriod[0]} year{lockPeriod[0] !== 1 ? 's' : ''}
                    </Label>
                    <div className="text-2xl font-bold text-secondary mb-4">
                      {lockPeriod[0]} Year{lockPeriod[0] !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="px-4">
                    <Slider
                      value={lockPeriod}
                      onValueChange={setLockPeriod}
                      min={1}
                      max={3}
                      step={1}
                      className="w-full slider-smooth"
                      data-testid="slider-lock-period"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-4">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                    </div>
                  </div>
                </div>

                {/* Reward Calculation */}
                <div className="text-center mb-8 p-4 bg-primary/10 rounded-lg">
                  <div className="text-sm font-medium mb-2">Estimated Rewards</div>
                  <div className="text-2xl font-bold text-primary" data-testid="estimated-rewards">
                    {calculateRewards().toLocaleString()} {COIN_TICKER}
                  </div>
                  <div className="text-sm font-medium mt-1">
                    APY: <span className="text-primary font-bold">{calculateAPY(lockPeriod[0])}%</span> yearly
                  </div>
                </div>

                {/* Referrer Input - Moved to bottom */}
                {/* {isConnected && !userStakes?.hasReferrer && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 mb-8">
                    <Label htmlFor="referrer" className="text-sm font-medium mb-2 block">Add Referrer (Optional)</Label>
                    <div className="flex gap-2">
                      <input
                        id="referrer"
                        placeholder="Enter referrer address"
                        value={referrerAddress}
                        onChange={(e) => setReferrerAddress(e.target.value)}
                        className="flex-1 h-10 px-3 py-2 bg-muted/20 rounded-xl border border-border focus:border-primary transition-colors outline-none"
                      />
                    </div>
                  </div>
                )} */}
              </TabsContent>

              <TabsContent value="unstake" className="space-y-6">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <Button
                      onClick={connect}
                      className="neon-button w-3/4 py-6 rounded-xl text-lg font-bold"
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
                              <span className="font-semibold">{parseFloat(stake.amount).toLocaleString()} {COIN_TICKER}</span>
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

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Stake Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Stake Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm">{stakeAmount} {COIN_TICKER}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Lock Period:</span>
                <span className="text-sm">{lockPeriod[0]} year{lockPeriod[0] !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estimated APY:</span>
                <span className="text-sm">{calculateAPY(lockPeriod[0])}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estimated Rewards:</span>
                <span className="text-sm">
                  {(Number(stakeAmount) * calculateAPY(lockPeriod[0]) / 100 * lockPeriod[0]).toFixed(2)} {COIN_TICKER}
                </span>
              </div>
            </div>

            {/* Referrer Input - Show if no referrer is set */}
            {!validationReferrer && (
              <div className="space-y-2">
                <Label htmlFor="validation-referrer">Referrer Address (Optional)</Label>
                <input
                  id="validation-referrer"
                  type="text"
                  placeholder="0x..."
                  value={validationReferrer}
                  onChange={(e) => setValidationReferrer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a referrer address to earn additional rewards
                </p>
              </div>
            )}

            {/* Show referrer if already set */}
            {validationReferrer && (
              <div className="space-y-2">
                <Label>Referrer Address</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                    {validationReferrer}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setValidationReferrer('')}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowValidationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStake}
              disabled={stakeMutation.isPending}
              className="w-3/4 mx-auto py-6"
            >
              {stakeMutation.isPending ? 'Staking...' : 'Confirm Stake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
