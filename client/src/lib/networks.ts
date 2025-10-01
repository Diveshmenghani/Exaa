export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  rpcUrls?: string[]; // Additional RPC URLs for fallback
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    ZE_TOKEN_ADDRESS: string;
    USDT_TOKEN_ADDRESS: string;
    USDC_TOKEN_ADDRESS: string;
    BUSD_TOKEN_ADDRESS: string;
    FUSD_TOKEN_ADDRESS: string;
    EXAA_SWAP_ADDRESS: string;
    EXAA_STAKING_ADDRESS: string;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    id: 'testnet',
    name: 'Holesky Testnet',
    chainId: 17000,
    rpcUrl: 'https://holesky.drpc.org',
    rpcUrls: [
      'https://holesky.drpc.org',
      'https://ethereum-holesky-rpc.publicnode.com',
      'https://holesky.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc.holesky.ethpandaops.io'
    ],
    blockExplorerUrl: 'https://holesky.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      ZE_TOKEN_ADDRESS: '0x00140Dc2155aA4197B88464aC8fee02D161f76fa',
      USDT_TOKEN_ADDRESS: '0x74b674aE859D5d1D910738FB881119CB4b6A6a03', // Holesky testnet USDT
      USDC_TOKEN_ADDRESS: '0x2Ca330C1F35579AA9f7e5d34D6E173d3a87Ab24B', // Holesky testnet USDC
      BUSD_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000000',
      FUSD_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000000',
      EXAA_SWAP_ADDRESS: '0x18c740E313e1a585F6EAD9D5c94e03aC763cAaa7', // Separate swap contract address
      EXAA_STAKING_ADDRESS: '0xa1D318b4c6F68f72d32211857Bd98e31e11143d0',
    },
  },
  mainnet: {
    id: 'mainnet',
    name: 'BSC Mainnet',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    rpcUrls: [
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed4.binance.org',
      'https://bsc.drpc.org'
    ],
    blockExplorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      ZE_TOKEN_ADDRESS: '0x00001',
      USDT_TOKEN_ADDRESS: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
      USDC_TOKEN_ADDRESS: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
      BUSD_TOKEN_ADDRESS: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD on BSC
      FUSD_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000000',
      EXAA_SWAP_ADDRESS: '0x00001',
      EXAA_STAKING_ADDRESS: '0x00001',
    },
  },
};

export const DEFAULT_NETWORK = 'testnet';

export function getNetworkConfig(networkId: string): NetworkConfig {
  return NETWORKS[networkId] || NETWORKS[DEFAULT_NETWORK];
}

export function isValidNetwork(networkId: string): boolean {
  return networkId in NETWORKS;
}