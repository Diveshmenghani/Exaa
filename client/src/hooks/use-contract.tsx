import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './use-wallet';
import ExaaStakingABI from '../lib/contracts/ExaaStaking.json';
import ExaaSwapABI from '../lib/contracts/ExaaSwap.json';
import CoinABI from '../lib/contracts/coin.json';

// Contract addresses for Holesky testnet
const EXAA_STAKING_ADDRESS = '0x6e24A5Ec49aE76Cd720FB6550aA0a1D57C823e0F'; // Holesky testnet staking contract
const EXAA_TOKEN_ADDRESS = '0x00140Dc2155aA4197B88464aC8fee02D161f76fa'; // Holesky testnet token address
const EXAA_SWAP_ADDRESS = '0x373952976f26481b914962bc28f6F08964E8339b'; // Swap functionality will be added later
const USDT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // USDT on Holesky (to be added later)

interface ContractContextType {
  stakingContract: ethers.Contract | null;
  tokenContract: ethers.Contract | null;
  swapContract: ethers.Contract | null;
  usdtContract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  // Token contract functions
  getTokenBalance: (address: string) => Promise<string>;
  checkContractDeployment: () => Promise<boolean>;
  // Staking contract functions
  approveTokens: (amount: string) => Promise<boolean>;
  approveAndStake: (amount: string, lockYears: number, referrer: string) => Promise<boolean>;
  stake: (amount: string, lockYears: number, referrer: string) => Promise<boolean>;
  unstake: (stakeIndex: number) => Promise<boolean>;
  addReferrer: (referrer: string) => Promise<boolean>;
  getUserInfo: (address: string) => Promise<any>;
  getTotalStaked: (address: string) => Promise<string>;
  getUserStakes: (address: string) => Promise<any[]>;
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
            CoinABI.abi,
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
      
      // Validate and format amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError('Invalid stake amount');
        setIsLoading(false);
        return false;
      }
      
      // Convert string amount to Wei (proper format for contract)
      const amountInWei = ethers.utils.parseEther(amount.toString().trim());
      
      // Validate lock period (must be positive integer)
      if (!Number.isInteger(lockYears) || lockYears <= 0) {
        setError('Lock period must be a positive integer');
        setIsLoading(false);
        return false;
      }
      
      // Ensure referrer address is valid
      const formattedReferrer = referrer && referrer !== '0x0000000000000000000000000000000000000000' 
        ? ethers.utils.getAddress(referrer) // Normalize address format
        : '0x0000000000000000000000000000000000000000';
      
      console.log('Staking with parameters:', {
        amount: amount,
        amountInWei: amountInWei.toString(),
        lockYears: lockYears,
        referrer: formattedReferrer
      });
      
      const tx = await stakingContract.stake(amountInWei, lockYears, formattedReferrer);
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

  // Approve tokens for staking
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
      
      // Validate and format amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError('Invalid approval amount');
        setIsLoading(false);
        return false;
      }
      
      // Convert string amount to Wei
      const amountInWei = ethers.utils.parseEther(amount.toString().trim());
      
      console.log('Approving tokens:', {
        amount: amount,
        amountInWei: amountInWei.toString(),
        spender: EXAA_STAKING_ADDRESS
      });
      
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

  // Combined approve and stake function
  const approveAndStake = async (amount: string, lockYears: number, referrer: string): Promise<boolean> => {
    try {
      // First approve tokens
      const approvalSuccess = await approveTokens(amount);
      if (!approvalSuccess) {
        return false;
      }
      
      // Then stake tokens
      const stakeSuccess = await stake(amount, lockYears, referrer);
      return stakeSuccess;
    } catch (err: any) {
      console.error('Error in approve and stake:', err);
      setError(err.message || 'Failed to approve and stake tokens');
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

  // Unstake tokens from Holesky testnet
  const unstake = async (stakeIndex: number): Promise<boolean> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to unstake');
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
      const tx = await stakingContract.unstake(stakeIndex);
      await tx.wait();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error unstaking:', err);
      setError(err.message || 'Failed to unstake tokens');
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

  // Get total staked amount for a user
  const getTotalStaked = async (address: string): Promise<string> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return '0';
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to get total staked');
          return '0';
        }
      } catch (err: any) {
        console.error('Error switching to Holesky:', err);
        setError('Failed to switch to Holesky testnet');
        return '0';
      }
    }

    try {
      setIsLoading(true);
      // Get user info which includes totalStaked
      const userInfo = await stakingContract.getUserInfo(address);
      setIsLoading(false);
      
      // Return the totalStaked from the contract
      return ethers.utils.formatEther(userInfo.totalStaked);
    } catch (err: any) {
      console.error('Error getting total staked:', err);
      setError(err.message || 'Failed to get total staked amount');
      setIsLoading(false);
      // Return "0" instead of throwing to prevent UI crashes
      return "0";
    }
  };

  // Get user stakes from blockchain
  const getUserStakes = async (address: string): Promise<any[]> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return [];
    }

    // Ensure we're on Holesky network
    if (!isHoleskyNetwork) {
      try {
        const switched = await switchToHoleskyNetwork();
        if (!switched) {
          setError('Please switch to Holesky testnet to get stakes');
          return [];
        }
      } catch (err: any) {
        console.error('Error switching to Holesky:', err);
        setError('Failed to switch to Holesky testnet');
        return [];
      }
    }

    try {
      setIsLoading(true);
      // Get user info which includes stakes array
      const userInfo = await stakingContract.getUserInfo(address);
      setIsLoading(false);
      
      // Return the stakes array from the contract
      return userInfo.stakes || [];
    } catch (err: any) {
      console.error('Error getting user stakes:', err);
      setError(err.message || 'Failed to get user stakes');
      setIsLoading(false);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
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

  // Check if contracts are properly deployed
  const checkContractDeployment = async (): Promise<boolean> => {
    if (!signer || !isHoleskyNetwork) {
      return false;
    }

    try {
      const provider = signer.provider;
      
      // Check token contract
      const tokenCode = await provider!.getCode(EXAA_TOKEN_ADDRESS);
      if (tokenCode === '0x') {
        console.error('Token contract not deployed at:', EXAA_TOKEN_ADDRESS);
        return false;
      }
      
      // Check staking contract
      const stakingCode = await provider!.getCode(EXAA_STAKING_ADDRESS);
      if (stakingCode === '0x') {
        console.error('Staking contract not deployed at:', EXAA_STAKING_ADDRESS);
        return false;
      }
      
      console.log('All contracts verified as deployed');
      return true;
    } catch (err: any) {
      console.error('Error checking contract deployment:', err);
      return false;
    }
  };

  // Get token balance for a specific address
  const getTokenBalance = async (address: string): Promise<string> => {
    if (!tokenContract || !address) {
      return '0';
    }

    try {
      // First check if we're connected to the right network
      if (!isHoleskyNetwork) {
        console.warn('Not connected to Holesky network, cannot fetch balance');
        return '0';
      }

      // Check if the contract exists by getting its code
      const provider = tokenContract.provider;
      const code = await provider.getCode(EXAA_TOKEN_ADDRESS);
      
      if (code === '0x') {
        console.error('Token contract not deployed at address:', EXAA_TOKEN_ADDRESS);
        return '0';
      }

      const balance = await tokenContract.balanceOf(address);
      return ethers.utils.formatEther(balance);
    } catch (err: any) {
      console.error('Error fetching token balance:', err);
      
      // Handle specific error types
      if (err.code === 'CALL_EXCEPTION') {
        console.error('Contract call failed - contract may not exist or network issues');
      } else if (err.message?.includes('historical state')) {
        console.error('RPC provider historical state error - trying again later');
      }
      
      return '0';
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
          getTokenBalance,
          checkContractDeployment,
          approveTokens,
          approveAndStake,
          stake,
          unstake,
          addReferrer,
          getUserInfo,
          getTotalStaked,
          getUserStakes,
          buyTokens,
          sellTokens,
          approveUSDT,
          approveExaaForSelling,
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