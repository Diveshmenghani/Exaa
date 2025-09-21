import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  
  const backgroundColors = [
    'linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #16213E 100%)',
    'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
    'linear-gradient(135deg, #16213E 0%, #0F3460 50%, #533483 100%)',
    'linear-gradient(135deg, #0F3460 0%, #533483 50%, #1A1A2E 100%)',
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop - windowHeight / 2 && 
            scrollPosition < sectionTop + sectionHeight - windowHeight / 2) {
          if (index !== currentSection) {
            setCurrentSection(index);
            document.body.style.background = backgroundColors[index % backgroundColors.length];
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSection]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background overlay */}
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-black mb-6 glitch-text">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              STAKE HICA
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Next-generation staking protocol with multi-level referrals and hyper-rewards. 
            Lock your tokens for up to 3 years and earn exponential returns.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/stake">
              <Button 
                className="neon-button px-8 py-4 rounded-xl text-lg font-bold text-white"
                data-testid="button-start-staking"
              >
                Start Staking Now
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="glass-card px-8 py-4 rounded-xl text-lg font-bold"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
          
          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-total-staked">
                  $2.4M
                </div>
                <div className="text-muted-foreground">Total Staked</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent" data-testid="text-max-apy">
                  15%
                </div>
                <div className="text-muted-foreground">Max APY</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent" data-testid="text-active-stakers">
                  1,247
                </div>
                <div className="text-muted-foreground">Active Stakers</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="text-referral-levels">
                  25
                </div>
                <div className="text-muted-foreground">Referral Levels</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3D Floating Element */}
        <div className="absolute top-20 right-20 cube-3d w-20 h-20 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary rounded-lg"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                Why Choose HICA?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">Revolutionary features designed for maximum returns</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <i className="fas fa-lock text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">Secure Staking</h3>
                <p className="text-muted-foreground">
                  Lock your HICA tokens for 1-3 years with guaranteed returns and emergency unstake protection.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-secondary/50 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">Multi-Level Referrals</h3>
                <p className="text-muted-foreground">
                  Earn up to 12% commission across 25 levels of referrals with our innovative reward system.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-accent/50 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center">
                  <i className="fas fa-exchange-alt text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4">Token Swapping</h3>
                <p className="text-muted-foreground">
                  Seamlessly swap between USDT and HICA at 1:1 ratio with instant transactions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 relative parallax-bg" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 212, 255, 0.1))'
      }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Get Started Today
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">Choose your path to maximizing returns</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/swap">
              <Card className="glass-card hover:border-primary/50 transition-all duration-300 cursor-pointer group" data-testid="card-token-swap">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-exchange-alt text-white text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">Token Swapping</h3>
                  <p className="text-muted-foreground">
                    Exchange USDT for HICA tokens at 1:1 ratio
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/stake">
              <Card className="glass-card hover:border-secondary/50 transition-all duration-300 cursor-pointer group" data-testid="card-staking">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-coins text-white text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-secondary">Staking</h3>
                  <p className="text-muted-foreground">
                    Lock tokens and earn up to 15% monthly returns
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="glass-card hover:border-accent/50 transition-all duration-300 cursor-pointer group" data-testid="card-referrals">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-accent to-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-network-wired text-white text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-accent">Referral Network</h3>
                  <p className="text-muted-foreground">
                    Build your network and earn passive income
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl"></div>
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                HICA
              </span>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              The future of decentralized staking with hyper-rewards and multi-level referral systems. 
              Built for the next generation of DeFi enthusiasts.
            </p>
            <div className="flex justify-center space-x-6 mb-8">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-twitter">
                <i className="fab fa-twitter text-2xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-discord">
                <i className="fab fa-discord text-2xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-telegram">
                <i className="fab fa-telegram text-2xl"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-github">
                <i className="fab fa-github text-2xl"></i>
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 HICA Protocol. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
