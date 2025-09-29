import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle, Clock, Circle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { APP_NAME } from '@/lib/branding';
import type { RoadmapItem } from '@shared/schema';

export default function RoadMap() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Fetch roadmap data
  const { data: roadmapItems = [], isLoading } = useQuery<RoadmapItem[]>({
    queryKey: ['/api/roadmap'],
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-blue-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'from-green-500/20 to-emerald-600/20 border-green-500/30';
      case 'in_progress':
        return 'from-blue-500/20 to-purple-600/20 border-blue-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Planned</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Product Roadmap
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our journey to build the most comprehensive DeFi ecosystem with multiple innovative products and services
          </p>
        </div>

        {/* Interactive Roadmap */}
        <div className="max-w-6xl mx-auto">
          {/* Timeline Visualization */}
          <div className="relative mb-16">
            {/* Connection Lines */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 via-cyan-500 to-green-500 rounded-full opacity-30"></div>
            
            {/* Roadmap Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roadmapItems.map((item, index) => {
                const isExpanded = expandedItems.includes(item.id);
                const isEven = index % 2 === 0;
                
                return (
                  <div key={item.id} className={`relative ${isEven ? 'md:mt-0' : 'md:mt-16'}`}>
                    {/* Connector Circle */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                      <div className={`w-12 h-12 rounded-full border-4 bg-background flex items-center justify-center ${
                        item.status === 'completed' 
                          ? 'border-green-500 bg-green-500/20' 
                          : item.status === 'in_progress'
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-500 bg-gray-500/20'
                      }`}>
                        {getStatusIcon(item.status)}
                      </div>
                    </div>

                    {/* Level Badge */}
                    <div className="text-center mb-4 mt-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl">
                        {item.level}
                      </div>
                    </div>

                    {/* Card */}
                    <Card 
                      className={`glass-card hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br ${getStatusColor(item.status)}`}
                      data-testid={`roadmap-item-${item.level}`}
                    >
                      <Collapsible>
                        <CollapsibleTrigger 
                          className="w-full"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-muted-foreground">MILESTONE</span>
                              {getStatusBadge(item.status)}
                            </div>
                            
                            <h3 className="text-xl font-bold mb-3 text-white">
                              {item.title}
                            </h3>
                            
                            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                              {item.description}
                            </p>

                            <div className="flex items-center justify-center text-primary">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                              <span className="ml-2 text-sm">
                                {isExpanded ? 'Show Less' : 'Learn More'}
                              </span>
                            </div>
                          </CardContent>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-6 pb-6">
                            <div className="border-t border-border/30 pt-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Status:</span>
                                  <span className="text-sm text-white capitalize">{(item.status || 'planned').replace('_', ' ')}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Level:</span>
                                  <span className="text-sm text-primary font-semibold">{item.level}</span>
                                </div>

                                {item.status === 'completed' && (
                                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <div className="flex items-center text-green-400">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      <span className="text-sm font-medium">Milestone Achieved!</span>
                                    </div>
                                  </div>
                                )}

                                {item.status === 'in_progress' && (
                                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center text-blue-400">
                                      <Clock className="w-4 h-4 mr-2" />
                                      <span className="text-sm font-medium">Currently in Development</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Summary */}
          <Card className="glass-card">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 text-white">
                  Ecosystem Development Progress
                </h2>
                <p className="text-muted-foreground">
                  Track our journey as we build the future of decentralized finance and technology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {roadmapItems.filter(item => item.status === 'completed').length}
                  </div>
                  <div className="text-sm text-green-300">Completed Milestones</div>
                </div>

                <div className="text-center p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {roadmapItems.filter(item => item.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-blue-300">In Development</div>
                </div>

                <div className="text-center p-6 bg-gray-500/10 border border-gray-500/30 rounded-xl">
                  <div className="text-3xl font-bold text-gray-400 mb-2">
                    {roadmapItems.filter(item => item.status === 'planned').length}
                  </div>
                  <div className="text-sm text-gray-300">Planned Features</div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Join us on this exciting journey as we revolutionize the DeFi space
                </p>
                <Button className="neon-button px-8 py-3">
                  Stay Updated
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}