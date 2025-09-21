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
          <p className="text-xl text-muted-foreground">Track your referral network and earnings</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-card text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <i className="fas fa-user text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-2" data-testid="text-user-address">
                    {user?.walletAddress?.substring(0, 6)}...{user?.walletAddress?.substring(user.walletAddress.length - 4)}
                  </h3>
                  <p className="text-muted-foreground" data-testid="text-join-date">
                    Joined {formatDate(user?.createdAt || new Date())}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-bold">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Staked</span>
                    <span className="font-bold" data-testid="text-total-staked">
                      {parseFloat(user?.totalStaked || '0').toLocaleString()} HICA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Earned</span>
                    <span className="font-bold text-primary" data-testid="text-total-earned">
                      {parseFloat(user?.totalEarned || '0').toLocaleString()} HICA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Referrals</span>
                    <span className="font-bold text-secondary" data-testid="text-total-referrals">
                      {user?.totalReferrals || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Referral Earnings</span>
                    <span className="font-bold text-accent" data-testid="text-referral-earnings">
                      {parseFloat(user?.referralEarnings || '0').toLocaleString()} HICA
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <Button
                    onClick={() => claimMutation.mutate()}
                    disabled={claimMutation.isPending || parseFloat(user?.referralEarnings || '0') <= 0}
                    className="neon-button w-full py-3 rounded-lg"
                    data-testid="button-claim-referral-rewards"
                  >
                    {claimMutation.isPending ? 'Claiming...' : 'Claim Referral Rewards'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Referral Network */}
            <div className="lg:col-span-2">
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
      </div>
    </div>
  );
}
