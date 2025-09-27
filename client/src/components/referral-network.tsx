import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { REFERRAL_COMMISSION_RATES } from '@/lib/constants';

interface ReferralNetworkProps {
  referrals: any[];
  totalReferrals: number;
  referralEarnings: string;
  referralLink: string;
  onClaim: () => void;
  isClaiming: boolean;
}

export default function ReferralNetwork({ 
  referrals, 
  totalReferrals, 
  referralEarnings, 
  referralLink, 
  onClaim, 
  isClaiming 
}: ReferralNetworkProps) {
  
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
  };

  const getReferralsByLevel = (level: number) => {
    return referrals.filter(r => r.level === level).length;
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Referral Network</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Network Visualization */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                <i className="fas fa-user text-white text-xl"></i>
              </div>
              <span className="font-bold">You</span>
              <div className="text-sm text-muted-foreground">
                {totalReferrals} total referrals
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {REFERRAL_COMMISSION_RATES.slice(0, 8).map(rate => {
                const count = getReferralsByLevel(rate.level);
                return (
                  <div key={rate.level} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">L{rate.level}</span>
                    </div>
                    <div className="text-sm font-semibold" data-testid={`text-level-${rate.level}-count`}>
                      {count} users
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rate.rate}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Referral Link */}
          <div className="p-4 bg-muted/10 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Your Referral Link</div>
                <div className="font-mono text-sm break-all" data-testid="text-referral-link">
                  {referralLink}
                </div>
              </div>
              <Button
                onClick={copyReferralLink}
                variant="outline"
                size="sm"
                className="ml-4 neon-button"
                data-testid="button-copy-referral"
              >
                <i className="fas fa-copy"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Earnings */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Referral Earnings</CardTitle>
            <Button
              onClick={onClaim}
              disabled={isClaiming || parseFloat(referralEarnings) <= 0}
              className="neon-button"
              data-testid="button-claim-referral-rewards"
            >
              {isClaiming ? 'Claiming...' : 'Claim Rewards'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="text-claimable-rewards">
              {parseFloat(referralEarnings).toLocaleString()} ZE
            </div>
            <div className="text-muted-foreground">Available to claim</div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Rates */}
      {/* <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Commission Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {REFERRAL_COMMISSION_RATES.slice(0, 10).map(rate => (
              <div key={rate.level} className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                <span className="text-sm">Level {rate.level}</span>
                <span className="font-bold text-primary">{rate.rate}%</span>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
              <span className="text-sm">Levels 11-25</span>
              <span className="font-bold text-secondary">0.75-0.25%</span>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
