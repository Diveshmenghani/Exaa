import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import robotImage from '../assets/robot.png';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubscribe = () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Newsletter subscription:', { email });
    toast({
      title: 'Success!',
      description: 'Thank you for subscribing to Zeritheum updates!',
    });
    
    setEmail('');
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      
      <div className="absolute bottom-0 right-8 hidden lg:block opacity-80">
        <img 
          src={robotImage} 
          alt="DeFi Robot" 
          className="w-80 h-auto animate-float"
          data-testid="img-robot"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" data-testid="text-newsletter-title">
              Sign Up to Receive <span className="gradient-text">Updates and Announcements</span>
            </h2>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-8 md:p-12 space-y-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-14 text-base rounded-full px-6 bg-background/50"
                data-testid="input-email"
              />
              <Button
                size="lg"
                onClick={handleSubscribe}
                className="h-14 px-8 rounded-full text-base hover-elevate active-elevate-2 whitespace-nowrap"
                data-testid="button-subscribe"
              >
                Subscribe
              </Button>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-center text-muted-foreground mb-6">Or connect with us on social media</p>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="text-base px-8 rounded-full hover-elevate active-elevate-2"
                  onClick={() => window.open('https://t.me/zeritheum', '_blank')}
                  data-testid="button-join-telegram"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Join Our Telegram
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
