import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NetworkConfig, getNetworkConfig, DEFAULT_NETWORK, isValidNetwork } from '@/lib/networks';

interface NetworkContextType {
  currentNetwork: NetworkConfig;
  networkId: string;
  switchNetwork: (networkId: string) => Promise<void>;
  isTestnet: boolean;
  isMainnet: boolean;
  getNetworkConfig: (networkId: string) => NetworkConfig;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkId, setNetworkId] = useState<string>(() => {
    // Get network from localStorage or use default
    const saved = localStorage.getItem('selectedNetwork');
    return saved && isValidNetwork(saved) ? saved : DEFAULT_NETWORK;
  });

  const currentNetwork = getNetworkConfig(networkId);

  const switchNetwork = async (newNetworkId: string) => {
    if (isValidNetwork(newNetworkId)) {
      // First update the local state
      setNetworkId(newNetworkId);
      localStorage.setItem('selectedNetwork', newNetworkId);
      
      // Immediately trigger MetaMask network switch if connected
      if (window.ethereum) {
        try {
          await switchWalletNetwork(newNetworkId);
        } catch (error) {
          console.error('Failed to switch wallet network:', error);
          // Even if wallet switch fails, keep the local network selection
        }
      }
    }
  };

  const switchWalletNetwork = async (newNetworkId: string) => {
    const network = getNetworkConfig(newNetworkId);
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
      
      console.log(`Successfully switched to ${network.name}`);
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          console.log(`Adding ${network.name} to MetaMask...`);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: network.rpcUrls || [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorerUrl],
              },
            ],
          });
          
          console.log(`Successfully added and switched to ${network.name}`);
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw new Error(`Failed to add ${network.name} to MetaMask`);
        }
      } else {
        console.error('Failed to switch network:', switchError);
        throw new Error(`Failed to switch to ${network.name}`);
      }
    }
  };

  const isTestnet = networkId === 'testnet';
  const isMainnet = networkId === 'mainnet';

  return (
    <NetworkContext.Provider
      value={{
        currentNetwork,
        networkId,
        switchNetwork,
        isTestnet,
        isMainnet,
        getNetworkConfig,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}