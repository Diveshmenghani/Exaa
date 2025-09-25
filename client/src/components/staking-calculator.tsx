import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APY_RATES, LOCK_PERIODS, REFERRAL_COMMISSION_RATES } from '@/lib/constants';
import { COIN_TICKER } from '@/lib/branding';

interface StakingCalculatorProps {
  onCalculationChange?: (calculation: {
    amount: string;
    lockPeriod: number;
    referralLevel: number;
    monthlyRewards: number;
    totalRewards: number;
  }) => void;
}

export default function StakingCalculator({ onCalculationChange }: StakingCalculatorProps) {
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [lockPeriod, setLockPeriod] = useState(12);
  const [referralLevel, setReferralLevel] = useState(0);

  const [calculation, setCalculation] = useState({
    baseAPY: 10,
    referralBonus: 0,
    monthlyRewards: 100,
    totalRewards: 2200,
  });

  useEffect(() => {
    const amount = parseFloat(stakeAmount) || 0;
    const baseAPY = APY_RATES[lockPeriod as keyof typeof APY_RATES] || 10;
    const referralBonus = referralLevel > 0 
      ? REFERRAL_COMMISSION_RATES.find(r => r.level === referralLevel)?.rate || 0
      : 0;
    
    const totalAPY = baseAPY + (referralBonus * 0.1); // Referral bonus adds to APY
    const monthlyRewards = (amount * totalAPY) / 100;
    const totalRewards = amount + (monthlyRewards * lockPeriod);

    const newCalculation = {
      baseAPY,
      referralBonus,
      monthlyRewards,
      totalRewards,
    };

    setCalculation(newCalculation);
    
    onCalculationChange?.({
      amount: stakeAmount,
      lockPeriod,
      referralLevel,
      monthlyRewards,
      totalRewards,
    });
  }, [stakeAmount, lockPeriod, referralLevel, onCalculationChange]);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Calculator Inputs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Stake Your {COIN_TICKER}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="block text-sm font-medium mb-2">Stake Amount</Label>
            <Input
              type="number"
              placeholder="1000"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full p-4 bg-muted/20 rounded-xl border border-border focus:border-primary transition-colors"
              data-testid="input-stake-amount"
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium mb-2">Lock Period</Label>
            <Select value={lockPeriod.toString()} onValueChange={(value) => setLockPeriod(parseInt(value))}>
              <SelectTrigger className="w-full p-4 bg-muted/20 rounded-xl border border-border focus:border-primary transition-colors" data-testid="select-lock-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCK_PERIODS.map(period => (
                  <SelectItem key={period.months} value={period.months.toString()}>
                    {period.label} ({period.apy}% monthly)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Your Referral Level</Label>
            <Select value={referralLevel.toString()} onValueChange={(value) => setReferralLevel(parseInt(value))}>
              <SelectTrigger className="w-full p-4 bg-muted/20 rounded-xl border border-border focus:border-primary transition-colors" data-testid="select-referral-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Referrals (0%)</SelectItem>
                {REFERRAL_COMMISSION_RATES.slice(0, 5).map(rate => (
                  <SelectItem key={rate.level} value={rate.level.toString()}>
                    Level {rate.level} ({rate.rate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Preview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reward Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/10 rounded-xl">
              <span>Stake Amount</span>
              <span className="font-bold" data-testid="text-display-stake-amount">
                {parseInt(stakeAmount || '0').toLocaleString()} {COIN_TICKER}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/10 rounded-xl">
              <span>Monthly APY</span>
              <span className="font-bold text-primary" data-testid="text-display-apy">
                {calculation.baseAPY}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/10 rounded-xl">
              <span>Referral Bonus</span>
              <span className="font-bold text-secondary" data-testid="text-display-referral-bonus">
                {calculation.referralBonus}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-primary/20 rounded-xl border border-primary/30">
              <span>Monthly Rewards</span>
              <span className="font-bold text-primary text-xl" data-testid="text-display-monthly-rewards">
                {Math.round(calculation.monthlyRewards).toLocaleString()} {COIN_TICKER}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-xl border border-secondary/30">
              <span>Total After Lock Period</span>
              <span className="font-bold text-secondary text-xl" data-testid="text-display-total-rewards">
                {Math.round(calculation.totalRewards).toLocaleString()} {COIN_TICKER}
              </span>
            </div>
          </div>

          {/* APY Chart Placeholder */}
          <div className="p-6 bg-muted/10 rounded-xl">
            <h4 className="font-semibold mb-4">Rewards Over Time</h4>
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-end justify-center">
              <span className="text-muted-foreground text-sm">Interactive chart visualization</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
