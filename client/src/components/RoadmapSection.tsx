import { Check, Clock, Rocket, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import shapesImage from '../assets/shapes.png';

const roadmapStages = [
  {
    stage: 'Stage 1',
    title: 'Protocol Complete',
    description: 'The core staking application contracts have been finalized and successfully deployed on both Testnet and Mainnet.',
    icon: Check,
    status: 'completed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  {
    stage: 'Stage 2',
    title: 'Token Deployment & Airdrop',
    description: 'The official ZE Token will be deployed soon! Following deployment, we will host a community airdrop event via Telegram. Get your wallet ready!',
    icon: Clock,
    status: 'in-progress',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  {
    stage: 'Stage 3',
    title: 'DeFi Integration',
    description: 'We will establish liquidity pools on major Decentralized Exchanges (DEXs), allowing anyone to easily buy and swap ZE tokens with other popular cryptocurrencies.',
    icon: Rocket,
    status: 'upcoming',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    stage: 'Stage 4',
    title: 'Ecosystem Rollout',
    description: 'The phased launch of our wider ecosystem begins, including the Education Platform, AI services, and more. The Zeritheum universe comes to life.',
    icon: Sparkles,
    status: 'upcoming',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute right-16 top-32 hidden lg:block opacity-35">
        <img 
          src={shapesImage} 
          alt="" 
          className="w-44 h-auto animate-float"
          data-testid="img-shapes-roadmap"
          style={{animationDelay: '2s'}}
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6" data-testid="text-roadmap-title">
            Our Journey to <span className="gradient-text">Launch & Beyond</span>.
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="text-roadmap-subtitle">
            We believe in transparency. Here's a look at what we've accomplished and the exciting milestones coming up.
            The future is closer than you think.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {roadmapStages.map((stage, index) => (
              <Card
                key={index}
                className={`group hover-elevate transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 cursor-pointer ${stage.bgColor} border-2 ${stage.borderColor}`}
                data-testid={`card-roadmap-${index}`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-xl bg-card/50 group-hover:scale-110 transition-transform duration-300`}>
                      <stage.icon className={`h-7 w-7 ${stage.color}`} />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${stage.bgColor} ${stage.color}`}>
                      {stage.status === 'completed' ? '✓ Complete' : stage.status === 'in-progress' ? '⏳ In Progress' : '🚀 Upcoming'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-medium" data-testid={`text-stage-${index}`}>
                      {stage.stage}
                    </p>
                    <h3 className="text-2xl font-bold" data-testid={`text-stage-title-${index}`}>
                      {stage.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid={`text-stage-desc-${index}`}>
                      {stage.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
