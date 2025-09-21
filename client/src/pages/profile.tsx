import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, Referral } from '@shared/schema';
import ReferralNetwork from '@/components/referral-network';

export default function Profile() {
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();
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

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; referrerCode?: string }) => {
      const response = await apiRequest('POST', '/api/users/register', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Registration Successful!',
        description: 'Welcome to HICA Protocol! You can now start staking.',
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
      const response = await apiRequest('GET', `/api/stakes/user/${walletAddress}`);
      return response.json();
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
        description: `Successfully claimed ${parseFloat(data.claimed).toLocaleString()} HICA tokens.`,
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
      queryClient.invalidateQueries({ queryKey: ['userStakes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
  if (!user && !userLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                Join the Network
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">Register with a referral code and start earning from day one</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Registration Form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Wallet Address</Label>
                    <Input
                      type="text"
                      value={walletAddress || ''}
                      disabled
                      className="w-full p-4 bg-muted/20 rounded-xl border border-border"
                      data-testid="input-wallet-address"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Referral Code (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full p-4 bg-muted/20 rounded-xl border border-border focus:border-primary transition-colors"
                      data-testid="input-referral-code"
                    />
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="neon-button w-full py-4 rounded-xl font-bold"
                    data-testid="button-register-account"
                  >
                    {registerMutation.isPending ? 'Registering...' : 'Register Account'}
                  </Button>
                </CardContent>
              </Card>

              {/* Referral Benefits */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Referral Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                    <span>Level 1</span>
                    <span className="font-bold text-primary">12%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                    <span>Level 2</span>
                    <span className="font-bold text-secondary">8%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                    <span>Level 3</span>
                    <span className="font-bold text-accent">6%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                    <span>Levels 4-5</span>
                    <span className="font-bold text-green-400">4-2%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                    <span>Levels 6-25</span>
                    <span className="font-bold text-yellow-400">1-0.25%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="grid lg:grid-cols-2 gap-8">
            {/* My Earnings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    My Earnings
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                  <div className="text-4xl font-bold mb-2" data-testid="text-total-hica-balance">
                    {(parseFloat(user?.totalEarned || '0') + parseFloat(user?.referralEarnings || '0')).toLocaleString()} HICA
                  </div>
                  <div className="text-muted-foreground">Total HICA Balance</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1" data-testid="text-staking-earnings">
                      {parseFloat(user?.totalEarned || '0').toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">From Staking</div>
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
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                    My Network
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-xl">
                  <div className="text-3xl font-bold mb-2" data-testid="text-total-referrals">
                    {user?.totalReferrals || 0}
                  </div>
                  <div className="text-muted-foreground">Total People Referred</div>
                </div>

                {/* Referral Levels */}
                <div className="space-y-3">
                  <h4 className="font-semibold mb-3">Referrals by Level</h4>
                  {[1, 2, 3, 4, 5].map(level => {
                    const levelCount = referrals.filter(r => r.level === level).length;
                    const commissionRate = level === 1 ? 12 : level === 2 ? 8 : level === 3 ? 6 : level === 4 ? 4 : 2;
                    return (
                      <div key={level} className="flex justify-between items-center p-3 bg-muted/10 rounded-lg" data-testid={`referral-level-${level}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-sm font-bold">
                            L{level}
                          </div>
                          <span>Level {level}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold" data-testid={`level-${level}-count`}>{levelCount} people</div>
                          <div className="text-sm text-muted-foreground">{commissionRate}% commission</div>
                        </div>
                      </div>
                    );
                  })}
                  {referrals.some(r => r.level > 5) && (
                    <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg" data-testid="referral-levels-6-plus">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-xs font-bold">
                          6+
                        </div>
                        <span>Levels 6-25</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" data-testid="levels-6-plus-count">{referrals.filter(r => r.level > 5).length} people</div>
                        <div className="text-sm text-muted-foreground">1-0.25% commission</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-3 flex items-center justify-center">
                    <i className="fas fa-user text-white text-xl"></i>
                  </div>
                  <div className="font-bold mb-1" data-testid="text-user-address">
                    {user?.walletAddress?.substring(0, 6)}...{user?.walletAddress?.substring(user.walletAddress.length - 4)}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="text-join-date">
                    Joined {formatDate(user?.createdAt || new Date())}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-full mx-auto mb-3 flex items-center justify-center">
                    <i className="fas fa-coins text-white text-xl"></i>
                  </div>
                  <div className="font-bold mb-1" data-testid="text-total-staked">
                    {parseFloat(user?.totalStaked || '0').toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">HICA Staked</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full mx-auto mb-3 flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  <div className="font-bold mb-1 text-primary" data-testid="text-total-earned">
                    {parseFloat(user?.totalEarned || '0').toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">HICA Earned</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-3 flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                  <div className="font-bold mb-1 text-secondary">
                    {user?.totalReferrals || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Referrals</div>
                </div>
              </div>
            </CardContent>
          </Card>

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
