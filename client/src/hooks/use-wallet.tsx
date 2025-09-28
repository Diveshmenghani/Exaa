import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToHoleskyNetwork: () => Promise<boolean>;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  isHoleskyNetwork: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Holesky testnet chain ID and RPC
const HOLESKY_CHAIN_ID = '0x4268'; // Chain ID for Holesky testnet (decimal: 17000)
const HOLESKY_RPC_URL = 'https://ethereum-holesky-rpc.publicnode.com';

// Fallback RPC URLs for better reliability
const HOLESKY_RPC_FALLBACKS = [
  'https://ethereum-holesky-rpc.publicnode.com',
  'https://holesky.drpc.org',
  'https://rpc.holesky.ethpandaops.io'
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isHoleskyNetwork, setIsHoleskyNetwork] = useState(false);

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
          setIsHoleskyNetwork(network.chainId === parseInt(HOLESKY_CHAIN_ID, 16));
        } else {
          // No accounts connected, reset state
          setWalletAddress(null);
          setIsConnected(false);
          setProvider(null);
          setSigner(null);
          setChainId(null);
          setIsHoleskyNetwork(false);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  // Function to switch to Holesky testnet
  const switchToHoleskyNetwork = async (): Promise<boolean> => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Ethereum wallet extension!');
      return false;
    }

    try {
      // Try to switch to Holesky network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HOLESKY_CHAIN_ID }],
      });
      
      // Update network status
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      setChainId(network.chainId);
      setIsHoleskyNetwork(network.chainId === parseInt(HOLESKY_CHAIN_ID, 16));
      
      return true;
    } catch (error: any) {
      // If the error code is 4902, the chain hasn't been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HOLESKY_CHAIN_ID,
                chainName: 'Holesky Testnet',
                nativeCurrency: {
                  name: 'Holesky ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: HOLESKY_RPC_FALLBACKS,
                blockExplorerUrls: ['https://holesky.etherscan.io/'],
              },
            ],
          });
          
          // Try switching again after adding
          return switchToHoleskyNetwork();
        } catch (addError) {
          console.error('Error adding Holesky network:', addError);
          return false;
        }
      }
      console.error('Error switching to Holesky network:', error);
      return false;
    }
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
      setIsHoleskyNetwork(network.chainId === parseInt(HOLESKY_CHAIN_ID, 16));
      
      // Automatically try to switch to Holesky network if not already on it
      if (network.chainId !== parseInt(HOLESKY_CHAIN_ID, 16)) {
        await switchToHoleskyNetwork();
      }
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
      switchToHoleskyNetwork,
      provider, 
      signer,
      chainId,
      isHoleskyNetwork
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

// Add this to global Window interface
declare global {
  interface Window {
    ethereum?: any;
  }
}
