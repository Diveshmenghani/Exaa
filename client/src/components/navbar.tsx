import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';

export default function Navbar() {
  const { isConnected, walletAddress, connect, disconnect } = useWallet();

  return (
    <nav className="fixed top-0 w-full z-50 glass-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                HICA
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
