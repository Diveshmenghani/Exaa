import { useLocation } from 'wouter';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import EcosystemSection from '../components/EcosystemSection';
import WhyChooseSection from '../components/WhyChooseSection';
import RoadmapSection from '../components/RoadmapSection';
import CommunitySection from '../components/CommunitySection';
import NewsletterSection from '../components/NewsletterSection';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';
import bubbles2 from '../assets/bubbles-2.png';
import bubbles3 from '../assets/bubbles-3.png';

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLaunchApp = () => {
    setLocation('/home');
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Floating bubble animations - mobile responsive */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Desktop bubbles */}
        <div className="hidden md:block absolute top-10 left-10 w-32 h-32 opacity-30">
          <img 
            src={bubbles2} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float"
          />
        </div>
        <div className="hidden md:block absolute top-20 right-20 w-24 h-24 opacity-40">
          <img 
            src={bubbles3} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float delay-1000"
          />
        </div>
        <div className="hidden lg:block absolute top-32 left-1/3 w-20 h-20 opacity-25">
          <img 
            src={bubbles2} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float delay-2000"
          />
        </div>
        <div className="hidden lg:block absolute top-16 right-1/3 w-28 h-28 opacity-35">
          <img 
            src={bubbles3} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float delay-500"
          />
        </div>
        
        {/* Mobile bubbles - smaller and better positioned */}
        <div className="md:hidden absolute top-20 left-4 w-16 h-16 opacity-20">
          <img 
            src={bubbles2} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float"
          />
        </div>
        <div className="md:hidden absolute top-32 right-4 w-12 h-12 opacity-25">
          <img 
            src={bubbles3} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float delay-1000"
          />
        </div>
        <div className="md:hidden absolute top-48 left-1/2 transform -translate-x-1/2 w-10 h-10 opacity-15">
          <img 
            src={bubbles2} 
            alt="Floating Bubbles" 
            className="w-full h-full animate-float delay-1500"
          />
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Launch App Button */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-4">
              Unlock the Power of DeFi.{' '}
              <span className="gradient-text">Simple, Secure, Rewarding</span>.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Zeritheum is your gateway to a comprehensive DeFi ecosystem, starting with our advanced staking protocol. Securely grow your assets and explore a new digital economy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 rounded-full"
                onClick={() => {
                  const element = document.getElementById('ecosystem');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Explore Our Vision
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <EcosystemSection />

      {/* Why Choose Section */}
      <WhyChooseSection />

      {/* Roadmap Section */}
      <RoadmapSection />

      {/* Community Section */}
      <CommunitySection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}