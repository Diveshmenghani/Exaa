import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { APP_NAME, LOGO_PATH } from '@/lib/branding';

export default function Navbar() {
  const { isConnected, walletAddress, connect, disconnect } = useWallet();

  return (
    <nav className="fixed top-0 w-full z-50 glass-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={LOGO_PATH} 
                alt="Zeritheum Logo" 
                className="w-10 h-10 object-contain rounded-lg"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" data-testid="link-nav-home">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer">Home</span>
            </Link>
            <Link href="/stake" data-testid="link-nav-stake">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer">Stake</span>
            </Link>
            <Link href="/swap" data-testid="link-nav-swap">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer">Swap</span>
            </Link>
            <Link href="/roadmap" data-testid="link-nav-roadmap">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer">RoadMap</span>
            </Link>
            <Link href="/profile" data-testid="link-nav-profile">
              <span className="text-foreground hover:text-primary transition-colors cursor-pointer">Profile</span>
            </Link>
          </div>
          
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground" data-testid="text-wallet-address">
                {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
              </span>
              <Button 
                onClick={disconnect}
                variant="outline"
                data-testid="button-disconnect-wallet"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={connect}
              className="neon-button px-6 py-2 rounded-lg text-white font-semibold"
              data-testid="button-connect-wallet"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
