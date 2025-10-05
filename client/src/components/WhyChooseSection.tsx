import { Card, CardContent } from '@/components/ui/card';
import { Shield, Zap, Globe } from 'lucide-react';
import shapesImage from '../assets/shapes.png';

const reasons = [
  {
    icon: Shield,
    title: 'Audited & Secure',
    subtitle: 'Unmatched Security',
    description: 'Our smart contracts are built on a foundation of security. Your assets are protected by a state-of-the-art protocol, allowing you to engage with DeFi with absolute peace of mind.',
    color: 'text-cyan-400',
    bg: 'bg-gradient-to-br from-cyan-500/5 to-blue-500/5',
  },
  {
    icon: Zap,
    title: 'Sustainable Rewards Engine',
    subtitle: 'Long-term Growth',
    description: 'Our protocol is engineered for long-term growth and stability. We provide a transparent and efficient way to compound your earnings as the network grows and prospers.',
    color: 'text-purple-400',
    bg: 'bg-gradient-to-br from-purple-500/5 to-pink-500/5',
  },
  {
    icon: Globe,
    title: 'A Complete DeFi Hub',
    subtitle: 'All-in-One Platform',
    description: "We're building an all-in-one portal to the decentralized world. Seamlessly swap tokens, stake assets, and access an entire ecosystem of platforms, all in one place.",
    color: 'text-pink-400',
    bg: 'bg-gradient-to-br from-pink-500/5 to-purple-500/5',
  },
];

export default function WhyChooseSection() {
  return (
    <section id="stake" className="py-20 md:py-32 bg-gradient-to-b from-transparent via-primary/5 to-transparent relative overflow-hidden">
      <div className="absolute left-16 bottom-24 hidden lg:block opacity-30">
        <img 
          src={shapesImage} 
          alt="" 
          className="w-36 h-auto animate-float"
          data-testid="img-shapes-why"
          style={{animationDelay: '1s'}}
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" data-testid="text-why-choose-title">
            Built for <span className="gradient-text">Security</span>, Designed for You.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {reasons.map((reason, index) => (
            <Card
              key={index}
              className={`group hover-elevate transition-all duration-500 hover:scale-[1.03] hover:-translate-y-3 cursor-pointer ${reason.bg}`}
              data-testid={`card-reason-${index}`}
            >
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-start">
                  <div className="p-3 rounded-xl bg-card/50 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <reason.icon className={`h-8 w-8 ${reason.color}`} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2" data-testid={`text-reason-subtitle-${index}`}>
                    {reason.subtitle}
                  </p>
                  <h3 className="text-2xl font-bold mb-4" data-testid={`text-reason-title-${index}`}>
                    {reason.title}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed" data-testid={`text-reason-desc-${index}`}>
                  {reason.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
