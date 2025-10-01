import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { APP_NAME, LOGO_PATH } from '@/lib/branding';
import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { isConnected, walletAddress, connect, disconnect } = useWallet();
  const { currentNetwork, networkId, switchNetwork } = useNetwork();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNetworkChange = (network: string) => {
    switchNetwork(network as 'testnet' | 'mainnet');
  };

  const networks = {
    testnet: { name: 'Holosky Testnet', color: 'text-orange-400' },
    mainnet: { name: 'BSC Mainnet', color: 'text-green-400' }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-card-transparent">
      <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
              <img 
                src={LOGO_PATH} 
                alt="Zeritheum Logo" 
                className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain rounded-lg"
              />
              <span className="text-sm sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" data-testid="link-nav-home">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium">Home</span>
            </Link>
            <Link href="/stake" data-testid="link-nav-stake">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium">Stake</span>
            </Link>
            <Link href="/swap" data-testid="link-nav-swap">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium">Swap</span>
            </Link>
            <Link href="/roadmap" data-testid="link-nav-roadmap">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium">RoadMap</span>
            </Link>
            <Link href="/profile" data-testid="link-nav-profile">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer text-sm font-medium">Profile</span>
            </Link>
            
            {/* Network Selector */}
            <Select value={networkId} onValueChange={handleNetworkChange}>
              <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-700">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${networkId === 'testnet' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                    <span className="text-xs">{currentNetwork.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="testnet">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <span>Holosky Testnet</span>
                  </div>
                </SelectItem>
                <SelectItem value="mainnet">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>BSC Mainnet</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Wallet Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs sm:text-sm text-muted-foreground" data-testid="text-wallet-address">
                  {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
                </span>
                <Button 
                  onClick={disconnect}
                  variant="outline"
                  size="sm"
                  data-testid="button-disconnect-wallet"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={connect}
                className="neon-button px-4 sm:px-6 py-2 rounded-lg text-white font-semibold text-sm"
                data-testid="button-connect-wallet"
              >
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Network Indicator */}
            <div className="flex items-center space-x-1 mr-2">
              <div className={`w-2 h-2 rounded-full ${networkId === 'testnet' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                {networkId === 'testnet' ? 'Test' : 'BSC'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4 pt-4">
              {/* Mobile Navigation Links */}
              <Link href="/" data-testid="link-nav-home-mobile">
                <span className="block text-foreground hover:text-primary transition-colors cursor-pointer text-base font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}>Home</span>
              </Link>
              <Link href="/stake" data-testid="link-nav-stake-mobile">
                <span className="block text-foreground hover:text-primary transition-colors cursor-pointer text-base font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}>Stake</span>
              </Link>
              <Link href="/swap" data-testid="link-nav-swap-mobile">
                <span className="block text-foreground hover:text-primary transition-colors cursor-pointer text-base font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}>Swap</span>
              </Link>
              <Link href="/roadmap" data-testid="link-nav-roadmap-mobile">
                <span className="block text-foreground hover:text-primary transition-colors cursor-pointer text-base font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}>RoadMap</span>
              </Link>
              <Link href="/profile" data-testid="link-nav-profile-mobile">
                <span className="block text-foreground hover:text-primary transition-colors cursor-pointer text-base font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}>Profile</span>
              </Link>
              
              {/* Mobile Network Selector */}
              <div className="py-2">
                <span className="text-sm font-medium text-muted-foreground mb-2 block">Network</span>
                <Select value={networkId} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="w-full bg-gray-800/50 border-gray-700">
                    <SelectValue>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${networkId === 'testnet' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                        <span>{currentNetwork.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="testnet">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span>Testnet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="mainnet">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span>BSC Mainnet</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Wallet Section - Removed as per instruction */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
