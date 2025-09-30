import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToNetwork: (chainId: number) => Promise<boolean>;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  isCorrectNetwork: (expectedChainId: number) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Check if wallet was previously connected
  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const web3Signer = web3Provider.getSigner();
          const address = await web3Signer.getAddress();
          const network = await web3Provider.getNetwork();
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setWalletAddress(address);
          setChainId(network.chainId);
          setIsConnected(true);
        } else {
          // No accounts connected, reset state
          setWalletAddress(null);
          setIsConnected(false);
          setProvider(null);
          setSigner(null);
          setChainId(null);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  // Function to switch to any network
  const switchToNetwork = async (targetChainId: number): Promise<boolean> => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Ethereum wallet extension!');
      return false;
    }

    try {
      // Try to switch to the target network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      // Update network status
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      setChainId(network.chainId);
      
      return true;
    } catch (error: any) {
      console.error('Error switching network:', error);
      return false;
    }
  };

  // Helper function to check if wallet is on the correct network
  const isCorrectNetwork = (expectedChainId: number): boolean => {
    return chainId === expectedChainId;
  };

  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnect();
        } else {
          // User switched accounts
          checkConnection();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const connect = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert('Please install MetaMask wallet extension!');
        return;
      }

      // Force MetaMask to be used as the provider
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      
      // Request account access
      await window.ethereum.request({ 
        method: 'eth_requestAccounts',
      });
      
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setWalletAddress(address);
      setChainId(network.chainId);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      walletAddress, 
      connect, 
      disconnect, 
      switchToNetwork,
      provider, 
      signer,
      chainId,
      isCorrectNetwork
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
