import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { APP_NAME, COIN_TICKER, STAKED_DERIVATIVE, BRANDING } from '@/lib/branding';

export default function Home() {
  const [stakeAmount, setStakeAmount] = useState(1);
  const [lockPeriod, setLockPeriod] = useState([1]);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  // Staking calculations
  const getApy = (years: number) => {
    if (years === 1) return 10;
    if (years === 2) return 12;
    if (years === 3) return 15;
    return 10;
  };

  const apy = getApy(lockPeriod[0]);
  const annualReward = (stakeAmount * apy) / 100;

  useEffect(() => {
    // Set vibrant gradient background to match new logo
    document.body.style.background = 'linear-gradient(135deg, #000000 0%, #1a0a2e 20%, #16213e 40%, #0f3460 60%, #0e4b99 80%, #2e86c1 100%)';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  return (
    <div className="min-h-screen text-white">
      {/* Hero Section with Staking Calculator */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Hero Text */}
            <div className="space-y-8">
              <div>
                <h1 className="text-6xl md:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    Stake {COIN_TICKER}
                  </span>
                  <br />
                  <span className="text-white">on your</span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    terms.
                  </span>
                </h1>
              </div>
              
              <div className="space-y-4 text-gray-300 text-lg max-w-lg">
                <p>Go Solo or Pool with others.</p>
                <p>Stake or unstake in seconds.</p>
                <p>Use your stake in DeFi.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">👥</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white" data-testid="text-total-stakers">86k+</div>
                  <div className="text-sm text-gray-300">Total stakers</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">💎</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white" data-testid="text-total-staked">{COIN_TICKER} 317.63k</div>
                  <div className="text-sm text-gray-300">Total staked</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs">🏆</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white" data-testid="text-rewards-paid">{COIN_TICKER} 26.14k</div>
                  <div className="text-sm text-gray-300">Rewards paid</div>
                </div>
              </div>
            </div>

            {/* Right Side - Staking Calculator Widget */}
            <div className="space-y-4">
              {/* APY and Reward Card */}
              <Card className="bg-white/80 backdrop-blur-md border-white/40 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 mb-1">Monthly Return</div>
                    <div className="text-2xl font-bold text-gray-900">{apy}%</div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-600 mb-1">You will receive</div>
                    <div className="text-2xl font-bold text-gray-900">{COIN_TICKER} {annualReward.toFixed(5)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Staking Input */}
              <Card className="bg-white/90 backdrop-blur-md border-white/50 rounded-2xl shadow-xl">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 0)}
                        className="text-4xl font-bold bg-transparent border-none text-gray-900 placeholder-gray-500 p-0 h-auto focus:outline-none"
                        style={{ fontSize: '2.5rem', fontWeight: 'bold' }}
                        min="0"
                        step="0.1"
                        data-testid="input-stake-amount"
                      />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{COIN_TICKER}</div>
                      </div>
                    </div>

                  </div>

                  {/* Lock Period Slider */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700 font-medium">Lock Period: {lockPeriod[0]} year(s)</div>
                    <Slider
                      value={lockPeriod}
                      onValueChange={setLockPeriod}
                      max={3}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                    </div>
                  </div>

                  {/* Stake Button */}
                  <div className="flex justify-center">
                    <Link href="/stake">
                      <Button 
                        className="neon-button w-auto px-16 py-8 text-white font-semibold rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-4"
                        data-testid="button-stake"
                      >
                        Stake
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Zeritheum Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-white">
              Why Choose 
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent ml-3">
                {APP_NAME}
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Experience the most advanced staking ecosystem with unmatched security, 
              liquidity, and rewards designed for both beginners and validators
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Simple and Secure Staking */}
            <Card 
              className={`relative overflow-hidden bg-white/10 backdrop-blur-md border-white/20 rounded-3xl transition-all duration-500 hover:scale-105 cursor-pointer ${
                hoveredFeature === 0 ? 'bg-white/20 border-white/40' : ''
              }`}
              onMouseEnter={() => setHoveredFeature(0)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <div className="text-4xl">🔐</div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Simple and secure</h3>
                <h4 className="text-lg font-semibold text-white mb-4">staking with {STAKED_DERIVATIVE}.</h4>
                
                <div className="space-y-4 text-gray-300 text-left">
                  <p className="text-sm leading-relaxed">
                    Get <span className="text-white font-semibold">{STAKED_DERIVATIVE}</span> and start staking in 
                    seconds. Staking has never been easier.
                  </p>
                  <p className="text-sm leading-relaxed">
                    <span className="text-white font-semibold">Earn staking rewards</span> every second 
                    by holding {STAKED_DERIVATIVE}.
                  </p>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full px-6 py-2"
                  >
                    Stake with {STAKED_DERIVATIVE}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Staking Marketplace */}
            <Card 
              className={`relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-orange-500/20 backdrop-blur-md border-pink-500/30 rounded-3xl transition-all duration-500 hover:scale-105 cursor-pointer ${
                hoveredFeature === 1 ? 'from-pink-500/30 to-orange-500/30 border-pink-500/50' : ''
              }`}
              onMouseEnter={() => setHoveredFeature(1)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <div className="text-4xl">📦</div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Staking</h3>
                <h4 className="text-xl font-bold mb-2 text-white">marketplace with</h4>
                <h4 className="text-xl font-bold mb-6 text-white">unbeatable terms.</h4>
                
                <div className="space-y-4 text-gray-100 text-left">
                  <p className="text-sm leading-relaxed">
                    Browse <span className="text-white font-semibold">Vaults</span> and stake with the 
                    node operators that meet your criteria.
                  </p>
                  <p className="text-sm leading-relaxed">
                    <span className="text-white font-semibold">Higher yield, more decentralization</span> and control.
                  </p>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="bg-white/20 border-white/40 text-white hover:bg-white/30 rounded-full px-6 py-2"
                  >
                    Stake with Vaults
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liquid Solo Staking */}
            <Card 
              className={`relative overflow-hidden bg-gray-900/50 backdrop-blur-md border-gray-700/50 rounded-3xl transition-all duration-500 hover:scale-105 cursor-pointer ${
                hoveredFeature === 2 ? 'bg-gray-800/60 border-gray-600/60' : ''
              }`}
              onMouseEnter={() => setHoveredFeature(2)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <div className="text-4xl">🔬</div>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Liquid staking</h3>
                <h4 className="text-xl font-bold mb-6 text-white">for your solo validators.</h4>
                
                <div className="space-y-4 text-gray-300 text-left">
                  <p className="text-sm leading-relaxed">
                    <span className="text-white font-semibold">Liquid solo staking</span> for anyone 
                    who can run a node.
                  </p>
                  <p className="text-sm leading-relaxed">
                    Open your own Vault and <span className="text-white font-semibold">accept 
                    delegations</span> from others. <span className="text-white font-semibold">No 
                    collateral needed.</span>
                  </p>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full px-6 py-2"
                  >
                    Become an Operator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Get Started Section */}
      <section className="py-24 relative bg-gradient-to-br from-purple-900/30 to-pink-900/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-white">
              Get Started 
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent ml-3">
                Today
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of users earning rewards through our revolutionary staking platform
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Quick Stake */}
            <Link href="/stake">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-md border-blue-500/30 rounded-3xl transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <div className="text-4xl">⚡</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Quick Stake</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Start earning rewards instantly with our one-click staking solution. Perfect for beginners.
                  </p>
                  <div className="space-y-3 text-sm text-gray-300 text-left">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      <span>Instant staking in seconds</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span>Up to 15% monthly returns</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                      <span>Flexible lock periods</span>
                    </div>
                  </div>
                  <Button className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 group-hover:shadow-lg">
                    Start Staking
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Token Swap */}
            <Link href="/swap">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-md border-emerald-500/30 rounded-3xl transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <div className="text-4xl">🔄</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Token Exchange</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Seamlessly swap between USDT and {COIN_TICKER} tokens with zero fees and instant execution.
                  </p>
                  <div className="space-y-3 text-sm text-gray-300 text-left">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                      <span>1:1 exchange ratio</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-teal-400 rounded-full mr-3"></div>
                      <span>Zero transaction fees</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span>Instant processing</span>
                    </div>
                  </div>
                  <Button className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 group-hover:shadow-lg">
                    Swap Tokens
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Referral Network */}
            <Link href="/profile">
              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-md border-orange-500/30 rounded-3xl transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 text-center relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-red-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <div className="text-4xl">🌐</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Build Network</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Earn passive income through our 25-level referral system with exponential rewards.
                  </p>
                  <div className="space-y-3 text-sm text-gray-300 text-left">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span>Up to 12% commission</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                      <span>25 referral levels</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                      <span>Passive income stream</span>
                    </div>
                  </div>
                  <Button className="mt-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 group-hover:shadow-lg">
                    Join Network
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Call to Action Banner */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-md border border-pink-500/30 rounded-full px-8 py-4">
              <span className="text-white text-lg font-semibold">Ready to maximize your returns?</span>
              <Link href="/stake">
                <Button className="ml-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105">
                  Start Now →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-16 relative">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
{COIN_TICKER}
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              The future of decentralized staking with innovative rewards and community-driven growth.
            </p>
            <div className="text-sm text-gray-500">
              © 2024 {APP_NAME} Protocol. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
