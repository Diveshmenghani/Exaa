import CircularRoadmap from '@/components/circular-roadmap';

export default function RoadMap() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-black">
      <div className="container mx-auto px-4 sm:px-6">
        <CircularRoadmap />
        
        {/* Additional Information Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">Our Vision</h3>
              <p className="text-gray-300 leading-relaxed">
                We're building the most comprehensive DeFi ecosystem with innovative staking solutions, 
                multi-level referral systems, and seamless cross-chain integration. Our roadmap represents 
                our commitment to delivering cutting-edge features that benefit our community.
              </p>
            </div>
            
            <div className="glass-card p-6 sm:p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">Join the Journey</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Be part of the future of decentralized finance. Each milestone brings us closer to 
                revolutionizing how people interact with DeFi protocols and earn passive income.
              </p>
              <button className="neon-button px-6 py-3 rounded-lg font-semibold">
                Start Staking Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}