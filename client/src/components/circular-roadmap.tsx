import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import roadmapImage from '@assets/image_1759120300420.png';

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned';
}

export default function CircularRoadmap() {
  const [selectedStep, setSelectedStep] = useState<number | null>(3);

  const roadmapSteps: RoadmapStep[] = [
    {
      id: 1,
      title: "Foundation",
      description: "Build the core infrastructure and smart contracts for the HICA staking protocol.",
      status: 'completed'
    },
    {
      id: 2,
      title: "Token Launch",
      description: "Launch HICA token with initial distribution and establish the first staking pools.",
      status: 'completed'
    },
    {
      id: 3,
      title: "Connect with Nature",
      description: "Spend time outside and appreciate the beauty and power of the natural world.",
      status: 'in_progress'
    },
    {
      id: 4,
      title: "DeFi Integration",
      description: "Integrate with major DeFi protocols and expand yield farming opportunities.",
      status: 'planned'
    },
    {
      id: 5,
      title: "Mobile App",
      description: "Launch mobile application for easy staking and portfolio management on the go.",
      status: 'planned'
    },
    {
      id: 6,
      title: "Cross-Chain",
      description: "Expand to multiple blockchains for broader accessibility and reduced fees.",
      status: 'planned'
    },
    {
      id: 7,
      title: "Governance",
      description: "Implement decentralized governance allowing token holders to vote on protocol changes.",
      status: 'planned'
    },
    {
      id: 8,
      title: "Ecosystem",
      description: "Build a complete DeFi ecosystem with lending, borrowing, and advanced trading features.",
      status: 'planned'
    }
  ];

  const getStepPosition = (index: number) => {
    const angle = (index * 45) - 90; // Start from top, 45 degrees apart
    const radius = 180; // Distance from center
    const centerX = 200; // Center X of the circle
    const centerY = 200; // Center Y of the circle
    
    const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
    const y = centerY + radius * Math.sin((angle * Math.PI) / 180);
    
    return { x, y, angle };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in_progress':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const selectedStepData = roadmapSteps.find(step => step.id === selectedStep);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
          <span className="text-white">Roadmap to </span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            success
          </span>
        </h2>
      </div>

      <div className="relative">
        {/* Main circular container */}
        <div className="relative w-full aspect-square max-w-[500px] mx-auto">
          {/* Background image */}
          <div 
            className="absolute inset-0 rounded-full bg-cover bg-center opacity-80"
            style={{
              backgroundImage: `url(${roadmapImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/60 via-blue-900/60 to-teal-900/60" />

          {/* Dotted connection lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
            <defs>
              <pattern id="dots" patternUnits="userSpaceOnUse" width="8" height="8">
                <circle cx="4" cy="4" r="1" fill="rgba(255,255,255,0.5)" />
              </pattern>
            </defs>
            {roadmapSteps.map((_, index) => {
              const current = getStepPosition(index);
              const next = getStepPosition((index + 1) % roadmapSteps.length);
              
              return (
                <line
                  key={index}
                  x1={current.x}
                  y1={current.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="url(#dots)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="opacity-60"
                />
              );
            })}
          </svg>

          {/* Step circles */}
          {roadmapSteps.map((step, index) => {
            const position = getStepPosition(index);
            const isSelected = selectedStep === step.id;
            
            return (
              <button
                key={step.id}
                className={`absolute w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                  getStatusColor(step.status)
                } ${isSelected ? 'ring-4 ring-white scale-125 z-10' : 'hover:ring-2 hover:ring-white/50'}`}
                style={{
                  left: `${(position.x / 400) * 100}%`,
                  top: `${(position.y / 400) * 100}%`,
                }}
                onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                data-testid={`roadmap-step-${step.id}`}
              >
                {step.id}
              </button>
            );
          })}
        </div>

        {/* Step details card */}
        {selectedStepData && (
          <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-teal-800/90 backdrop-blur-md border-teal-600 z-20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getStatusColor(selectedStepData.status)}`}>
                  {selectedStepData.id}
                </div>
                <button
                  onClick={() => setSelectedStep(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                {selectedStepData.id}. {selectedStepData.title}
              </h3>
              
              <p className="text-gray-200 text-sm leading-relaxed mb-4">
                {selectedStepData.description}
              </p>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentIndex = roadmapSteps.findIndex(s => s.id === selectedStep);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : roadmapSteps.length - 1;
                    setSelectedStep(roadmapSteps[prevIndex].id);
                  }}
                  className="text-white hover:bg-teal-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-xs text-gray-300 capitalize">
                  {selectedStepData.status.replace('_', ' ')}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentIndex = roadmapSteps.findIndex(s => s.id === selectedStep);
                    const nextIndex = currentIndex < roadmapSteps.length - 1 ? currentIndex + 1 : 0;
                    setSelectedStep(roadmapSteps[nextIndex].id);
                  }}
                  className="text-white hover:bg-teal-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-8">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-300">In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          <span className="text-sm text-gray-300">Planned</span>
        </div>
      </div>
    </div>
  );
}