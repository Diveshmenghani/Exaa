import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClientMock';
import { Stake, ContractSettings } from '@shared/schema';
import { COIN_TICKER } from '@/lib/branding';
import { ethers } from 'ethers';

export default function Unstake() {
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();
  const { unstake, getUserStakes } = useContract();

  const { data: stakes = [], isLoading } = useQuery<Stake[]>({
    queryKey: ['/api/stakes/user', walletAddress],
    enabled: !!walletAddress,
  });

  const { data: contractSettings } = useQuery<ContractSettings>({
    queryKey: ['/api/contract/settings'],
  });

  // Helper function to find stake index in blockchain
  const findStakeIndex = async (dbStake: any): Promise<number> => {
    if (!walletAddress) throw new Error('Wallet not connected');
    
    const blockchainStakes = await getUserStakes(walletAddress);
    
    // Match by amount and approximate timestamp
    const dbAmount = parseFloat(dbStake.amount);
    
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

  const unstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      // First get the stake to find the index
      const dbStake = stakes.find(s => s.id === stakeId);
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
      const response = await apiRequest('POST', `/api/stakes/${stakeId}/unstake`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Unstake Successful!',
        description: 'Your tokens have been unstaked and rewards transferred.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stakes'] });
    },
    onError: (error) => {
      toast({
        title: 'Unstake Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const emergencyUnstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      const response = await apiRequest('POST', `/api/stakes/${stakeId}/emergency-unstake`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Emergency Unstake Complete',
        description: 'Your principal has been returned (no rewards).',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stakes'] });
    },
    onError: (error) => {
      toast({
        title: 'Emergency Unstake Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Ready to unstake';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (diffMonths > 0) {
      return `${diffMonths}m ${remainingDays}d left`;
    }
    return `${diffDays}d left`;
  };

  const formatLockPeriod = (months: number) => {
    if (months === 12) return '1 Year';
    if (months === 24) return '2 Years';
    if (months === 36) return '3 Years';
    return `${months} months`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <Card className="glass-card p-8 text-center max-w-md">
          <CardContent>
            <i className="fas fa-wallet text-6xl text-muted-foreground mb-4"></i>
            <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view and manage your stakes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6 xl:max-w-full xl:px-8 2xl:px-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent to-destructive bg-clip-text text-transparent">
              Manage Stakes
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">View and manage your active stakes</p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Active Stakes */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Active Stakes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your stakes...</p>
                </div>
              ) : stakes.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-coins text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-bold mb-2">No Active Stakes</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any active stakes yet. Start staking to earn rewards!
                  </p>
                  <Button className="neon-button" data-testid="button-start-staking">
                    Start Staking
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stakes.map((stake) => (
                    <div
                      key={stake.id}
                      className={`p-6 bg-muted/10 rounded-xl border ${
                        stake.canUnstake ? 'border-green-500/30' : 'border-border'
                      }`}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Amount</div>
                          <div className="font-bold text-lg" data-testid={`text-stake-amount-${stake.id}`}>
                            {parseInt(stake.amount).toLocaleString()} {COIN_TICKER}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Lock Period</div>
                          <div className="font-semibold" data-testid={`text-stake-period-${stake.id}`}>
                            {formatLockPeriod(stake.lockPeriodMonths)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className="font-semibold" data-testid={`text-stake-status-${stake.id}`}>
                            {stake.canUnstake ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                Ready to Unstake
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                {formatTimeLeft(stake.endDate.toString())}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {stake.canUnstake ? 'Total Earned' : 'Current Earned'}
                          </div>
                          <div className="font-bold text-primary" data-testid={`text-stake-earned-${stake.id}`}>
                            {parseInt(stake.earnedAmount || '0').toLocaleString()} {COIN_TICKER}
                          </div>
                        </div>
                        <div>
                          {stake.canUnstake ? (
                            <Button
                              onClick={() => unstakeMutation.mutate(stake.id)}
                              disabled={unstakeMutation.isPending}
                              className="neon-button px-4 py-2 rounded-lg w-full"
                              data-testid={`button-unstake-${stake.id}`}
                            >
                              {unstakeMutation.isPending ? 'Unstaking...' : 'Unstake'}
                            </Button>
                          ) : (
                            <Button
                              disabled
                              variant="outline"
                              className="cursor-not-allowed w-full"
                              data-testid={`button-locked-${stake.id}`}
                            >
                              Locked
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Unstake */}
          <Card className="glass-card border border-destructive/30">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <i className="fas fa-exclamation-triangle text-destructive text-2xl"></i>
                <CardTitle className="text-2xl font-bold text-destructive">Emergency Unstake</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Emergency unstake is only available when the contract is paused. 
                You will only receive your principal amount without rewards.
              </p>
              
              <div className="space-y-4">
                {stakes.filter(stake => stake.isActive).map((stake) => (
                  <div key={stake.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                    <div>
                      <div className="font-semibold">
                        {parseInt(stake.amount).toLocaleString()} {COIN_TICKER}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatLockPeriod(stake.lockPeriodMonths)} stake
                      </div>
                    </div>
                    <Button
                      onClick={() => emergencyUnstakeMutation.mutate(stake.id)}
                      disabled={
                        emergencyUnstakeMutation.isPending || 
                        !contractSettings?.isPaused || 
                        !contractSettings?.emergencyUnstakeEnabled
                      }
                      variant="destructive"
                      className="px-4 py-2 rounded-lg"
                      data-testid={`button-emergency-unstake-${stake.id}`}
                    >
                      {emergencyUnstakeMutation.isPending ? 'Processing...' : 'Emergency Withdraw'}
                    </Button>
                  </div>
                ))}
                
                {stakes.filter(stake => stake.isActive).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active stakes available for emergency withdrawal
                  </div>
                )}
              </div>
              
              {(!contractSettings?.isPaused || !contractSettings?.emergencyUnstakeEnabled) && (
                <div className="mt-4 p-3 bg-muted/10 rounded-lg text-sm text-muted-foreground">
                  <i className="fas fa-info-circle mr-2"></i>
                  Contract is not paused - emergency unstake unavailable
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
