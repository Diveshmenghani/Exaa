import { Card, CardContent } from '@/components/ui/card';
import { Lock, Brain, TrendingUp, GraduationCap, Gamepad2, ShoppingBag } from 'lucide-react';
import shapesImage from '../assets/shapes.png';

const features = [
  {
    icon: Lock,
    title: 'Next-Gen Staking',
    description: 'Earn competitive, sustainable rewards by helping secure the network. Our flexible, high-yield protocol puts you in control.',
    gradient: 'from-cyan-500/10 to-blue-500/10',
  },
  {
    icon: Brain,
    title: 'AI-Powered Services',
    description: 'Leverage cutting-edge Artificial Intelligence for trading advisory and personalized astrological insights, exclusively for our community.',
    gradient: 'from-purple-500/10 to-pink-500/10',
  },
  {
    icon: TrendingUp,
    title: 'The New Digital Economy',
    description: 'Participate in the future of commerce with our integrated shopping marketplace and tokenized real estate investment platforms.',
    gradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Education & Gaming',
    description: 'Learn about the future of finance with our Education Platform and engage with our suite of immersive, blockchain-based games.',
    gradient: 'from-pink-500/10 to-purple-500/10',
  },
];

export default function EcosystemSection() {
  return (
    <section id="ecosystem" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute right-12 top-20 hidden lg:block opacity-40">
        <img 
          src={shapesImage} 
          alt="" 
          className="w-40 h-auto animate-float"
          data-testid="img-shapes-ecosystem"
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" data-testid="text-ecosystem-title">
            More Than Staking. A <span className="gradient-text">Universe of Opportunity</span>.
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="text-ecosystem-subtitle">
            Zeritheum is building a seamless, interconnected ecosystem designed for the future of the digital economy.
            From AI-powered services to next-generation commerce, your journey into Web3 starts here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover-elevate transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 cursor-pointer overflow-visible"
              data-testid={`card-ecosystem-${index}`}
            >
              <CardContent className="p-8">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3" data-testid={`text-feature-title-${index}`}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed" data-testid={`text-feature-desc-${index}`}>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
