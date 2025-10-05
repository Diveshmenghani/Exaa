import { Button } from '@/components/ui/button';
import { Send, Twitter, MessageCircle, Linkedin } from 'lucide-react';
import shapesImage from '../assets/shapes.png';

const socialLinks = [
  { icon: Twitter, label: 'Twitter', url: 'https://twitter.com/zeritheum', color: 'hover:text-cyan-400' },
  { icon: MessageCircle, label: 'Discord', url: 'https://discord.gg/zeritheum', color: 'hover:text-purple-400' },
  { icon: Linkedin, label: 'LinkedIn', url: 'https://linkedin.com/company/zeritheum', color: 'hover:text-blue-400' },
];

export default function CommunitySection() {
  return (
    <section id="learn" className="py-20 md:py-32 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-50">
        <img 
          src={shapesImage} 
          alt="Abstract Shapes" 
          className="w-48 h-auto animate-float"
          data-testid="img-shapes"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold" data-testid="text-community-title">
            Join a Growing <span className="gradient-text">Global Community</span>.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-community-subtitle">
            Be the first to know about our token launch, airdrop, and platform updates. Connect with the core team and
            fellow community members on our official channels.
          </p>

          <div className="pt-4">
            <Button
              size="lg"
              className="text-base px-8 rounded-full hover-elevate active-elevate-2"
              onClick={() => window.open('https://t.me/zeritheum', '_blank')}
              data-testid="button-join-telegram-community"
            >
              <Send className="h-5 w-5 mr-2" />
              Join Our Telegram Now
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-6">
            {socialLinks.map((social, index) => (
              <button
                key={index}
                onClick={() => window.open(social.url, '_blank')}
                className={`p-3 rounded-full bg-card hover-elevate active-elevate-2 transition-all duration-300 ${social.color}`}
                aria-label={social.label}
                data-testid={`button-social-${social.label.toLowerCase()}`}
              >
                <social.icon className="h-6 w-6" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
