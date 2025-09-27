import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, Referral } from '@shared/schema';
import ReferralNetwork from '@/components/referral-network';
import { APP_NAME, COIN_TICKER } from '@/lib/branding';
import { ethers } from 'ethers';

export default function Profile() {
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();
  const { getTokenBalance, getTotalStaked, unstake, getUserStakes } = useContract();
  const [referralCode, setReferralCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users', walletAddress],
    enabled: !!walletAddress,
  });

  // Fetch user referrals
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals', user?.id],
    enabled: !!user?.id,
  });

  // Fetch real token balance from blockchain
  const { data: realTokenBalance = '0', isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = useQuery({
    queryKey: ['tokenBalance', walletAddress],
    queryFn: async () => {
      if (!walletAddress || !getTokenBalance) return '0';
      return await getTokenBalance(walletAddress);
    },
    enabled: !!walletAddress && !!getTokenBalance,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount >= 3) return false;
      
      // Don't retry for certain error types
      if (error?.message?.includes('CALL_EXCEPTION') || 
          error?.message?.includes('historical state')) {
        return false;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Get total staked from blockchain
  const { data: totalStakedFromBlockchain, error: stakedError, refetch: refetchStaked } = useQuery({
    queryKey: ['totalStaked', walletAddress],
    queryFn: async () => {
      if (!walletAddress || !getTotalStaked) return '0';
      return await getTotalStaked(walletAddress);
    },
    enabled: !!walletAddress && !!getTotalStaked,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; referrerCode?: string }) => {
      const response = await apiRequest('POST', '/api/users/register', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Registration Successful!',
        description: `Welcome to ${APP_NAME} Protocol! You can now start staking.`,
      });
      setIsRegistering(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch user stakes for unstaking
  const { data: userStakes } = useQuery({
    queryKey: ['userStakes', walletAddress],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/stakes/user/${walletAddress}`);
        const data = await response.json();
        return data;
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
    enabled: !!walletAddress && !!user
  });

  // Claim referral rewards mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/referrals/claim', {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Rewards Claimed!',
        description: `Successfully claimed ${parseFloat(data.claimed).toLocaleString()} ${COIN_TICKER} tokens.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: 'Claim Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
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

  // Unstake mutation
  const unstakeMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      // First get the stake to find the index
      const dbStake = userStakes?.stakes?.find((s: any) => s.id === stakeId);
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
    },
    onError: (error) => {
      toast({
        title: 'Unstaking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRegister = () => {
    if (!walletAddress) return;
    
    registerMutation.mutate({
      walletAddress,
      referrerCode: referralCode || undefined,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const generateReferralLink = () => {
    const domain = window.location.origin;
    return `${domain}/register?ref=${user?.referralCode}`;
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <Card className="glass-card p-8 text-center max-w-md">
          <CardContent>
            <i className="fas fa-wallet text-6xl text-muted-foreground mb-4"></i>
            <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration state
  // if (!user && !userLoading) {
  //   return (
  //     <div className="min-h-screen pt-24 pb-20">
  //       <div className="container mx-auto px-6">
  //         <div className="text-center mb-16">
  //           <h1 className="text-5xl font-bold mb-4">
  //             <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
  //               Join the Network
  //             </span>
  //           </h1>
  //           <p className="text-xl text-muted-foreground">Register with a referral code and start earning from day one</p>
  //         </div>

  //         <div className="max-w-4xl mx-auto">
  //           <div className="grid md:grid-cols-2 gap-8">
  //             {/* Registration Form */}
  //             <Card className="glass-card">
  //               <CardHeader>
  //                 <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
  //               </CardHeader>
  //               <CardContent className="space-y-6">
  //                 <div>
  //                   <Label className="block text-sm font-medium mb-2">Wallet Address</Label>
  //                   <Input
  //                     type="text"
  //                     value={walletAddress || ''}
  //                     disabled
  //                     className="w-full p-4 bg-muted/20 rounded-xl border border-border"
  //                     data-testid="input-wallet-address"
  //                   />
  //                 </div>
  //                 <div>
  //                   <Label className="block text-sm font-medium mb-2">Referral Code (Optional)</Label>
  //                   <Input
  //                     type="text"
  //                     placeholder="Enter referral code"
  //                     value={referralCode}
  //                     onChange={(e) => setReferralCode(e.target.value)}
  //                     className="w-full p-4 bg-muted/20 rounded-xl border border-border focus:border-primary transition-colors"
  //                     data-testid="input-referral-code"
  //                   />
  //                 </div>
  //                 <Button
  //                   onClick={handleRegister}
  //                   disabled={registerMutation.isPending}
  //                   className="neon-button w-full py-4 rounded-xl font-bold"
  //                   data-testid="button-register-account"
  //                 >
  //                   {registerMutation.isPending ? 'Registering...' : 'Register Account'}
  //                 </Button>
  //               </CardContent>
  //             </Card>

  //             {/* Referral Benefits */}
              
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <CardContent>
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Profile
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">Track your earnings, network, and manage your investments</p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Earnings Overview */}
          <div className="grid lg:grid-cols-1 gap-8">
            {/* My Earnings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Account Information
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                   <div className="text-4xl font-bold mb-2" data-testid="text-total-balance">
                     {balanceLoading ? (
                       <div className="animate-pulse">Loading...</div>
                     ) : balanceError ? (
                       <div className="text-orange-500">
                         <div className="text-2xl">⚠️</div>
                         <div className="text-sm mt-1">Network Error</div>
                       </div>
                     ) : (
                       `${parseFloat(realTokenBalance).toLocaleString()} ${COIN_TICKER}`
                     )}
                   </div>
                   <div className="text-muted-foreground">
                     {balanceError ? (
                       <div className="text-xs text-orange-400">
                         Unable to fetch balance from blockchain. Please check your network connection.
                       </div>
                     ) : (
                       `Total ${COIN_TICKER} Balance`
                     )}
                   </div>
                 </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1" data-testid="text-staking-earnings">
                      {parseFloat(user?.totalEarned || '0').toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">From Staking</div>
                  </div>
                  <div className="text-center p-4 bg-muted/10 rounded-lg">
                    <div className="text-2xl font-bold text-secondary mb-1" data-testid="text-total-staked">
                      {stakedError ? (
                        <div className="text-orange-500 text-sm">⚠️ Error</div>
                      ) : (
                        parseFloat(totalStakedFromBlockchain || user?.totalStaked || '0').toLocaleString()
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                  </div>
                  <div className="text-center p-4 bg-muted/10 rounded-lg">
                    <div className="text-2xl font-bold text-secondary mb-1" data-testid="text-referral-earnings-amount">
                      {parseFloat(user?.referralEarnings || '0').toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">From Referrals</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => claimMutation.mutate()}
                    disabled={claimMutation.isPending || parseFloat(user?.referralEarnings || '0') <= 0}
                    className="neon-button w-full py-3 rounded-lg"
                    data-testid="button-claim-referral-income"
                  >
                    {claimMutation.isPending ? 'Claiming...' : 'Claim Referral Income'}
                  </Button>
                  <Button
                    onClick={() => {
                      const unstakableStake = userStakes?.find((stake: any) => stake.canUnstake && stake.isActive);
                      if (!unstakableStake) {
                        toast({
                          title: 'No Unstakable Stakes',
                          description: 'You have no stakes that can be unstaked at this time.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      unstakeMutation.mutate(unstakableStake.id);
                    }}
                    disabled={unstakeMutation.isPending || !userStakes?.some((stake: any) => stake.canUnstake && stake.isActive)}
                    variant="outline"
                    className="w-full py-3 rounded-lg border-primary/50 hover:border-primary"
                    data-testid="button-unstake-tokens"
                  >
                    {unstakeMutation.isPending ? 'Unstaking...' : 'Unstake Tokens'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Network */}
            
          </div>

          {/* Profile Stats */}
          

          {/* Referral Network Details */}
          {referralsLoading ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading referral network...</p>
              </CardContent>
            </Card>
          ) : (
            <ReferralNetwork
              referrals={referrals}
              totalReferrals={user?.totalReferrals || 0}
              referralEarnings={user?.referralEarnings || '0'}
              referralLink={generateReferralLink()}
              onClaim={() => claimMutation.mutate()}
              isClaiming={claimMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
