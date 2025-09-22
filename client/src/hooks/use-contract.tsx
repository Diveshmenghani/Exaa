import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './use-wallet';
import ExaaStakingABI from '../lib/contracts/ExaaStaking.json';
import ExaaSwapABI from '../lib/contracts/ExaaSwap.json';

// Contract addresses for Holesky testnet
const EXAA_STAKING_ADDRESS = '0x5BF66975653919bb035A7c9f0b948D5B5B64ef8c'; // Holesky testnet staking contract
const EXAA_TOKEN_ADDRESS = '0x083E7858e8539bF642d69CBba008675eABb84298'; // Holesky testnet token address
const EXAA_SWAP_ADDRESS = '0x0000000000000000000000000000000000000000'; // Swap functionality will be added later
const USDT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // USDT on Holesky (to be added later)

interface ContractContextType {
  stakingContract: ethers.Contract | null;
  tokenContract: ethers.Contract | null;
  swapContract: ethers.Contract | null;
  usdtContract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  // Staking contract functions
  stake: (amount: string, lockYears: number, referrer: string) => Promise<boolean>;
  addReferrer: (referrer: string) => Promise<boolean>;
  getUserInfo: (address: string) => Promise<any>;
  approveTokens: (amount: string) => Promise<boolean>;
  // Swap contract functions
  buyTokens: (usdtAmount: string, deadline: number) => Promise<boolean>;
  sellTokens: (exaaAmount: string, deadline: number) => Promise<boolean>;
  approveUSDT: (amount: string) => Promise<boolean>;
  approveExaaForSelling: (amount: string) => Promise<boolean>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

// ERC20 ABI for token approval
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const { signer, isConnected, isHoleskyNetwork, switchToHoleskyNetwork } = useWallet();
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [swapContract, setSwapContract] = useState<ethers.Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeContracts = async () => {
      if (signer && isConnected) {
        // Check if we're on Holesky network, if not, prompt to switch
        if (!isHoleskyNetwork) {
          try {
            const switched = await switchToHoleskyNetwork();
            if (!switched) {
              setError('Please switch to Holesky testnet to use this application');
              return;
            }
          } catch (err: any) {
            console.error('Error switching to Holesky:', err);
            setError('Failed to switch to Holesky testnet');
            return;
          }
        }
        
        try {
          // Initialize contracts
          const newStakingContract = new ethers.Contract(
            EXAA_STAKING_ADDRESS,
            ExaaStakingABI.abi,
            signer
          );
          
          const newTokenContract = new ethers.Contract(
            EXAA_TOKEN_ADDRESS,
            ERC20_ABI,
            signer
          );
          
          const newSwapContract = new ethers.Contract(
            EXAA_SWAP_ADDRESS,
            ExaaSwapABI.abi,
            signer
          );
          
          const newUsdtContract = new ethers.Contract(
            USDT_TOKEN_ADDRESS,
            ERC20_ABI,
            signer
          );
          
          setStakingContract(newStakingContract);
          setTokenContract(newTokenContract);
          setSwapContract(newSwapContract);
          setUsdtContract(newUsdtContract);
          setError(null);
        } catch (err: any) {
          console.error('Error initializing contracts:', err);
          setError(err.message || 'Error initializing contracts');
        }
      } else {
        // Reset contracts if wallet disconnects
        setStakingContract(null);
        setTokenContract(null);
        setSwapContract(null);
        setUsdtContract(null);
        setError(null);
      }
    };
    
    initializeContracts();
  }, [signer, isConnected, isHoleskyNetwork, switchToHoleskyNetwork]);

  // Approve tokens for staking on Holesky testnet
  const approveTokens = async (amount: string): Promise<boolean> => {
    if (!tokenContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to approve tokens');
          return false;
        }
      } catch (err: any) {
        console.error('Error switching to Holesky:', err);
        setError('Failed to switch to Holesky testnet');
        return false;
      }
    }

    try {
      setIsLoading(true);
      const amountInWei = ethers.utils.parseEther(amount);
      const tx = await tokenContract.approve(EXAA_STAKING_ADDRESS, amountInWei);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error approving tokens:', err);
      setError(err.message || 'Failed to approve tokens');
      setIsLoading(false);
      return false;
    }
  };

  // Stake tokens on Holesky testnet
  const stake = async (amount: string, lockYears: number, referrer: string): Promise<boolean> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to stake tokens');
          return false;
        }
      } catch (err: any) {
        console.error('Error switching to Holesky:', err);
        setError('Failed to switch to Holesky testnet');
        return false;
      }
    }

    try {
      setIsLoading(true);
      const amountInWei = ethers.utils.parseEther(amount);
      const tx = await stakingContract.stake(amountInWei, lockYears, referrer);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error staking tokens:', err);
      setError(err.message || 'Failed to stake tokens');
      setIsLoading(false);
      return false;
    }
  };

  // Add referrer on Holesky testnet
  const addReferrer = async (referrer: string): Promise<boolean> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to add referrer');
          return false;
        }
      } catch (err: any) {
        console.error('Error switching to Holesky:', err);
        setError('Failed to switch to Holesky testnet');
        return false;
      }
    }

    try {
      setIsLoading(true);
      const tx = await stakingContract.addReferrer(referrer);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error adding referrer:', err);
      setError(err.message || 'Failed to add referrer');
      setIsLoading(false);
      return false;
    }
  };

  // Get user info from Holesky testnet
  const getUserInfo = async (address: string): Promise<any> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return null;
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to get user info');
          return null;
        }
      } catch (err: any) {
        console.error('Error switching to Holesky:', err);
        setError('Failed to switch to Holesky testnet');
        return null;
      }
    }

    try {
      setIsLoading(true);
      const userInfo = await stakingContract.users(address);
      setIsLoading(false);
      return {
        isRegistered: userInfo.isRegistered,
        referrer: userInfo.referrer,
        lastInteractionTimestamp: userInfo.lastInteractionTimestamp.toString(),
        registrationTimestamp: userInfo.registrationTimestamp.toString(),
        pendingReferralRewards: ethers.utils.formatEther(userInfo.pendingReferralRewards)
      };
    } catch (err: any) {
      console.error('Error getting user info:', err);
      setError(err.message || 'Failed to get user information');
      setIsLoading(false);
      return null;
    }
  };

  // Buy tokens with USDT
  const buyTokens = async (usdtAmount: string, deadline: number): Promise<boolean> => {
    if (!swapContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      // USDT typically has 6 decimals
      const amountInWei = ethers.utils.parseUnits(usdtAmount, 6);
      const tx = await swapContract.buyTokens(amountInWei, deadline);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error buying tokens:', err);
      setError(err.message || 'Failed to buy tokens');
      setIsLoading(false);
      return false;
    }
  };

  // Sell Exaa tokens for USDT
  const sellTokens = async (exaaAmount: string, deadline: number): Promise<boolean> => {
    if (!swapContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      const amountInWei = ethers.utils.parseEther(exaaAmount);
      const tx = await swapContract.sellTokens(amountInWei, deadline);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error selling tokens:', err);
      setError(err.message || 'Failed to sell tokens');
      setIsLoading(false);
      return false;
    }
  };

  // Approve USDT for buying Exaa tokens
  const approveUSDT = async (amount: string): Promise<boolean> => {
    if (!usdtContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      // USDT typically has 6 decimals
      const amountInWei = ethers.utils.parseUnits(amount, 6);
      const tx = await usdtContract.approve(EXAA_SWAP_ADDRESS, amountInWei);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error approving USDT:', err);
      setError(err.message || 'Failed to approve USDT');
      setIsLoading(false);
      return false;
    }
  };

  // Approve Exaa tokens for selling
  const approveExaaForSelling = async (amount: string): Promise<boolean> => {
    if (!tokenContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      const amountInWei = ethers.utils.parseEther(amount);
      const tx = await tokenContract.approve(EXAA_SWAP_ADDRESS, amountInWei);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error approving Exaa tokens:', err);
      setError(err.message || 'Failed to approve Exaa tokens');
      setIsLoading(false);
      return false;
    }
  };

  return (
    <ContractContext.Provider
      value={{
        stakingContract,
        tokenContract,
        swapContract,
        usdtContract,
        isLoading,
        error,
        stake,
        addReferrer,
        getUserInfo,
        approveTokens,
        buyTokens,
        sellTokens,
        approveUSDT,
        approveExaaForSelling
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}