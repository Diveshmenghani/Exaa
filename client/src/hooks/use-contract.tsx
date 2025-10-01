import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useWallet } from './use-wallet';
import { useNetwork } from './use-network';
import ExaaStakingABI from '../lib/contracts/ExaaStaking.json';
import ExaaSwapABI from '../lib/contracts/ExaaSwap.json';
import CoinABI from '../lib/contracts/coin.json';

// Contract addresses will be retrieved from network configuration

// Helper function to handle RPC errors gracefully
const handleRpcError = (error: any, context: string): string => {
  console.error(`${context}:`, error);
  
  if (error?.code === 'CALL_EXCEPTION') {
    if (error?.error?.data?.message?.includes('historical state')) {
      return `Network issue: Historical state not available. Try refreshing or switching RPC endpoint.`;
    }
    if (error?.data === '0x' || error?.message?.includes('missing revert data')) {
      return `Contract interaction failed. Ensure you're on Holesky testnet and try refreshing.`;
    }
    if (error?.message?.includes('execution reverted')) {
      return `Transaction would fail: ${error?.reason || 'Contract execution reverted'}`;
    }
    return `Contract call failed: ${error?.reason || 'Transaction reverted without a reason'}`;
  }
  
  if (error?.code === -32603 || error?.message?.includes('Internal JSON-RPC error')) {
    return `RPC connection issue. Try refreshing the page or check your network connection.`;
  }
  
  if (error?.code === 'INSUFFICIENT_FUNDS') {
    return `Insufficient funds to complete the transaction.`;
  }
  
  if (error?.code === 'NETWORK_ERROR') {
    return `Network connection error. Check your internet connection and try again.`;
  }
  
  if (error?.code === 4001) {
    return `Transaction rejected by user.`;
  }
  
  return error?.message || `An error occurred in ${context}`;
};

// Utility function to retry contract calls with exponential backoff
const retryContractCall = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = "Contract call"
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for certain types of errors
      if (error?.code === 'CALL_EXCEPTION' && error?.message?.includes('missing revert data')) {
        console.warn(`${context} failed with missing revert data, not retrying`);
        throw error;
      }
      
      if (attempt === maxRetries) {
        console.error(`${context} failed after ${maxRetries + 1} attempts`);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

interface ContractContextType {
  stakingContract: ethers.Contract | null;
  tokenContract: ethers.Contract | null;
  swapContract: ethers.Contract | null;
  usdtContract: ethers.Contract | null;
  busdContract: ethers.Contract | null;
  usdcContract: ethers.Contract | null;
  fusdContract: ethers.Contract | null;
  ethContract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  // Token contract functions
  getTokenBalance: (tokenAddress: string, walletAddress?: string) => Promise<string>;
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
  // New ExaaSwap contract functions
  buyZe: (stablecoinAddress: string, stablecoinAmount: string, minZeAmount: string) => Promise<boolean>;
  sellZe: (zeAmount: string, stablecoinAddress: string, minStablecoinAmount: string) => Promise<boolean>;

  calculateZeAmountOut: (stablecoinAddress: string, stablecoinAmount: string) => Promise<string>;
  calculateStablecoinAmountOut: (zeAmount: string, stablecoinAddress: string) => Promise<string>;
  getZePrice: () => Promise<string>;
  getStablecoinList: () => Promise<{address: string, symbol: string, decimals: number}[]>;
  // Legacy functions (for backward compatibility)
  swapTokens: (fromToken: string, toToken: string, amount: string, slippagePercent?: number) => Promise<boolean>;
  getTokenPrice: (tokenAddress: string) => Promise<string>;
  getAmountOut: (fromToken: string, toToken: string, amountIn: string) => Promise<string>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

// ERC20 ABI for token approval
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function version() external view returns (string)"
];

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const { signer, isConnected, isCorrectNetwork, switchToNetwork } = useWallet();
  const { currentNetwork, getNetworkConfig } = useNetwork();
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [swapContract, setSwapContract] = useState<ethers.Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<ethers.Contract | null>(null);
  const [busdContract, setBusdContract] = useState<ethers.Contract | null>(null);
  const [usdcContract, setUsdcContract] = useState<ethers.Contract | null>(null);
  const [fusdContract, setFusdContract] = useState<ethers.Contract | null>(null);
  const [ethContract, setEthContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeContracts = async () => {
      if (signer && isConnected) {
        // Network switching will be handled by the network context
        // when user selects a different network
        
        try {
          // Get network-specific contract addresses
          const networkConfig = getNetworkConfig(currentNetwork.id);
          const contracts = networkConfig.contracts;
          
          // Initialize contracts
          const newStakingContract = new ethers.Contract(
            contracts.EXAA_STAKING_ADDRESS,
            ExaaStakingABI.abi,
            signer
          );
          
          const newTokenContract = new ethers.Contract(
            contracts.ZE_TOKEN_ADDRESS,
            CoinABI.abi,
            signer
          );
          
          const newSwapContract = new ethers.Contract(
            contracts.EXAA_SWAP_ADDRESS,
            ExaaSwapABI.abi,
            signer
          );
          
          // Initialize stablecoin contracts (only if addresses are not zero)
          const newUsdtContract = contracts.USDT_TOKEN_ADDRESS.toLowerCase() !== '0x0000000000000000000000000000000000000000'
            ? new ethers.Contract(contracts.USDT_TOKEN_ADDRESS, ERC20_ABI, signer) : null;
          const newBusdContract = contracts.BUSD_TOKEN_ADDRESS.toLowerCase() !== '0x0000000000000000000000000000000000000000'
            ? new ethers.Contract(contracts.BUSD_TOKEN_ADDRESS, ERC20_ABI, signer) : null;
          const newUsdcContract = contracts.USDC_TOKEN_ADDRESS.toLowerCase() !== '0x0000000000000000000000000000000000000000'
            ? new ethers.Contract(contracts.USDC_TOKEN_ADDRESS, ERC20_ABI, signer) : null;
          const newFusdContract = contracts.FUSD_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000' 
            ? new ethers.Contract(contracts.FUSD_TOKEN_ADDRESS, ERC20_ABI, signer) : null;
          
          // For ETH token, we'll use a placeholder since it's not defined in the network config
          const newEthContract = contracts.USDT_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000'
            ? new ethers.Contract(contracts.USDT_TOKEN_ADDRESS, ERC20_ABI, signer) : null;
          
          setStakingContract(newStakingContract);
          setTokenContract(newTokenContract);
          setSwapContract(newSwapContract);
          setUsdtContract(newUsdtContract);
          setBusdContract(newBusdContract);
          setUsdcContract(newUsdcContract);
          setFusdContract(newFusdContract);
          setEthContract(newEthContract);
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
        setBusdContract(null);
        setUsdcContract(null);
        setFusdContract(null);
        setEthContract(null);
        setError(null);
      }
    };
    
    initializeContracts();
  }, [signer, isConnected, currentNetwork, getNetworkConfig]);

  // Helper function to ensure we're on the correct network
  const ensureCorrectNetwork = async (): Promise<boolean> => {
    if (!isCorrectNetwork(currentNetwork.chainId)) {
      try {
        const switched = await switchToNetwork(currentNetwork.chainId);
        if (!switched) {
          setError(`Please switch to ${currentNetwork.name} to continue`);
          return false;
        }
      } catch (err: any) {
        console.error('Error switching network:', err);
        setError(`Failed to switch to ${currentNetwork.name}`);
        return false;
      }
    }
    return true;
  };


  
  // Stake function using traditional approval
  const stake = async (amount: string, lockYears: number, referrer: string): Promise<boolean> => {
    if (!stakingContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
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
      
      console.log('Staking with traditional approval parameters:', {
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

  // Swap tokens functionality with slippage protection
  const swapTokens = async (fromToken: string, toToken: string, amount: string, slippagePercent: number = 0.5): Promise<boolean> => {
    if (!swapContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Validate and format amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError('Invalid swap amount');
        setIsLoading(false);
        return false;
      }
      
      // Convert string amount to Wei (proper format for contract)
      const amountInWei = ethers.utils.parseEther(amount.toString().trim());
      
      console.log('Swapping with parameters:', {
        fromToken,
        toToken,
        amount,
        amountInWei: amountInWei.toString(),
        slippagePercent
      });
      
      // Get expected output amount from the smart contract
      let expectedAmountOut: ethers.BigNumber;
      try {
        expectedAmountOut = await swapContract.getAmountOut(fromToken, toToken, amountInWei);
      } catch (err: any) {
        console.error('Error getting expected amount out:', err);
        setError('Failed to calculate swap amount');
        setIsLoading(false);
        return false;
      }
      
      // Calculate minimum amount out with slippage protection
      const slippageMultiplier = (100 - slippagePercent) / 100;
      const minAmountOut = expectedAmountOut.mul(Math.floor(slippageMultiplier * 10000)).div(10000);
      
      console.log('Swap calculation:', {
        expectedAmountOut: ethers.utils.formatEther(expectedAmountOut),
        minAmountOut: ethers.utils.formatEther(minAmountOut),
        slippagePercent
      });
      
      // Get network-specific contract addresses
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      
      // Approve tokens first
      let approveTx;
      if (fromToken.toLowerCase() === contracts.USDT_TOKEN_ADDRESS.toLowerCase()) {
        approveTx = await approveUSDT(amount);
      } else if (fromToken.toLowerCase() === contracts.ZE_TOKEN_ADDRESS.toLowerCase()) {
        approveTx = await approveTokens(amount);
      }
      
      if (!approveTx) {
        setError('Failed to approve tokens for swap');
        setIsLoading(false);
        return false;
      }
      
      // Execute swap with slippage protection
      const tx = await swapContract.swap(fromToken, toToken, amountInWei, minAmountOut);
      await tx.wait();
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error swapping tokens:', err);
      setError(err.message || 'Failed to swap tokens');
      setIsLoading(false);
      return false;
    }
  };
  
  // Get token price from smart contract (Chainlink oracle)
  const getTokenPrice = async (tokenAddress: string): Promise<string> => {
    // Get network-specific contract addresses
    const networkConfig = getNetworkConfig(currentNetwork.id);
    const contracts = networkConfig.contracts;
    
    if (!swapContract || !isConnected) {
      console.error('Swap contract not initialized or wallet not connected');
      // Return fallback prices if contract not available
      if (tokenAddress.toLowerCase() === contracts.ZE_TOKEN_ADDRESS.toLowerCase()) {
        return '0.16';
      }
      if (tokenAddress.toLowerCase() === contracts.USDT_TOKEN_ADDRESS.toLowerCase()) {
        return '1.0';
      }
      return '0';
    }

    try {
      let priceInWei: ethers.BigNumber;
      
      // Get price from smart contract based on token address
      if (tokenAddress.toLowerCase() === contracts.ZE_TOKEN_ADDRESS.toLowerCase()) {
        // Get ZE token price from contract
        priceInWei = await swapContract.getZePrice();
      } else if (tokenAddress.toLowerCase() === contracts.USDT_TOKEN_ADDRESS.toLowerCase()) {
        // Get USDT price from contract
        priceInWei = await swapContract.getUsdtPrice();
      } else {
        console.error('Unknown token address:', tokenAddress);
        return '0';
      }
      
      // Convert from Wei to readable format (assuming 8 decimals for price feeds)
      const price = ethers.utils.formatUnits(priceInWei, 8);
      return price;
    } catch (err: any) {
      console.error('Error fetching token price from contract:', err);
      // Fallback prices if contract call fails
      if (tokenAddress.toLowerCase() === contracts.ZE_TOKEN_ADDRESS.toLowerCase()) {
        return '0.16';
      }
      if (tokenAddress.toLowerCase() === contracts.USDT_TOKEN_ADDRESS.toLowerCase()) {
        return '1.0';
      }
      return '0';
    }
  };

  // Get expected amount out from smart contract
  const getAmountOut = async (fromToken: string, toToken: string, amountIn: string): Promise<string> => {
    if (!swapContract || !isConnected) {
      console.error('Swap contract not initialized or wallet not connected');
      return '0';
    }

    try {
      // Validate and format amount
      if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
        return '0';
      }

      const amountInWei = ethers.utils.parseEther(amountIn.toString().trim());
      const amountOutWei = await swapContract.getAmountOut(fromToken, toToken, amountInWei);
      
      // Convert back to readable format
      return ethers.utils.formatEther(amountOutWei);
    } catch (err: any) {
      console.error('Error getting amount out from contract:', err);
      return '0';
    }
  };
  
  // Approve ETH for swapping
  const approveETH = async (amount: string): Promise<boolean> => {
    if (!ethContract || !isConnected) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Validate amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError('Invalid amount');
        setIsLoading(false);
        return false;
      }
      
      const amountInWei = ethers.utils.parseEther(amount.toString().trim());
      
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      
      // Approve ETH for swap contract
      const tx = await ethContract.approve(contracts.EXAA_SWAP_ADDRESS, amountInWei);
      await tx.wait();
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error approving ETH:', err);
      setError(err.message || 'Failed to approve ETH');
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

    // Ensure we're on the correct network
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return false;
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
      
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      
      console.log('Approving tokens:', {
        amount: amount,
        amountInWei: amountInWei.toString(),
        spender: contracts.EXAA_STAKING_ADDRESS
      });
      
      const tx = await tokenContract.approve(contracts.EXAA_STAKING_ADDRESS, amountInWei);
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

    // Ensure we're on the correct network
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return false;
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

    // Ensure we're on the correct network
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return false;
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

    // Ensure we're on the correct network
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return null;
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

    // Ensure we're on the correct network
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return '0';
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

    // Ensure we're on the correct network
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return [];
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
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const tx = await usdtContract.approve(networkConfig.contracts.EXAA_SWAP_ADDRESS, amountInWei);
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
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      const tx = await tokenContract.approve(contracts.EXAA_SWAP_ADDRESS, amountInWei);
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
    if (!signer) {
      return false;
    }

    try {
      const provider = signer.provider;
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      
      // Check token contract
      const tokenCode = await provider!.getCode(contracts.ZE_TOKEN_ADDRESS);
      if (tokenCode === '0x') {
        console.error('Token contract not deployed at:', contracts.ZE_TOKEN_ADDRESS);
        return false;
      }
      
      // Check staking contract
      const stakingCode = await provider!.getCode(contracts.EXAA_STAKING_ADDRESS);
      if (stakingCode === '0x') {
        console.error('Staking contract not deployed at:', contracts.EXAA_STAKING_ADDRESS);
        return false;
      }
      
      console.log('All contracts verified as deployed');
      return true;
    } catch (err: any) {
      console.error('Error checking contract deployment:', err);
      return false;
    }
  };

  // Get token balance for a specific token contract address
  const getTokenBalance = async (tokenAddress: string, walletAddress?: string): Promise<string> => {
    if (!tokenAddress) {
      return '0';
    }

    // Use provided wallet address or get from wallet hook
    const targetWalletAddress = walletAddress || (await signer?.getAddress());
    if (!targetWalletAddress) {
      return '0';
    }

    try {
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;

      // Create a contract instance for the specific token
      let targetContract;
      if (tokenAddress.toLowerCase() === contracts.ZE_TOKEN_ADDRESS.toLowerCase()) {
        // Use the existing ZE token contract
        targetContract = tokenContract;
      } else {
        // Create a new contract instance for stablecoins
        if (!signer?.provider) {
          console.error('Provider not available');
          return '0';
        }
        targetContract = new ethers.Contract(tokenAddress, [
          "function balanceOf(address owner) external view returns (uint256)",
          "function decimals() external view returns (uint8)"
        ], signer.provider);
      }

      if (!targetContract) {
        console.error('Could not create contract instance for address:', tokenAddress);
        return '0';
      }

      // Check if the contract exists by getting its code
      const provider = targetContract.provider;
      const code = await provider.getCode(tokenAddress);
      
      if (code === '0x') {
        console.error('Token contract not deployed at address:', tokenAddress);
        return '0';
      }

      // Get balance and decimals
      const balance = await targetContract.balanceOf(targetWalletAddress);
      
      // Get decimals for proper formatting
      let decimals = 18; // Default to 18 decimals
      try {
        decimals = await targetContract.decimals();
      } catch (decimalsError) {
        // If decimals() call fails, use defaults based on token type
        if (tokenAddress.toLowerCase() === contracts.USDT_TOKEN_ADDRESS.toLowerCase() ||
            tokenAddress.toLowerCase() === contracts.USDC_TOKEN_ADDRESS.toLowerCase()) {
          decimals = 6; // USDT and USDC typically use 6 decimals
        }
      }

      return ethers.utils.formatUnits(balance, decimals);
    } catch (err: any) {
      const errorMessage = handleRpcError(err, `Error fetching token balance for ${tokenAddress}`);
      console.error(errorMessage);
      return '0';
    }
  };

  // New ExaaSwap functions for stablecoin swaps



  // Helper function to get stablecoin decimals from contract
  const getStablecoinDecimalsFromMapping = async (stablecoinAddress: string): Promise<number> => {
    if (!swapContract) {
      return 18; // Default to 18 decimals
    }

    try {
      const stablecoinInfo = await swapContract.supportedStablecoins(stablecoinAddress);
      return stablecoinInfo.decimals;
    } catch (err: any) {
      console.error('Error getting stablecoin decimals:', err);
      // Fallback to hardcoded values
      return stablecoinAddress.toLowerCase().includes('usdt') ? 6 : 18;
    }
  };

  // Buy ZE tokens with stablecoins using permit (gasless approval)
  const buyZe = async (stablecoinAddress: string, stablecoinAmount: string, minZeAmount: string): Promise<boolean> => {
    if (!swapContract || !isConnected || !signer) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      
      // Verify contract exists at the address
      if (!signer.provider) {
        throw new Error('Provider not available');
      }
      const code = await signer.provider.getCode(contracts.EXAA_SWAP_ADDRESS);
      if (code === '0x' || code === '0x0') {
        throw new Error(`No contract found at address ${contracts.EXAA_SWAP_ADDRESS}`);
      }
      
      // Get stablecoin decimals from contract
      const decimals = await getStablecoinDecimals(stablecoinAddress);
      const amountInWei = ethers.utils.parseUnits(stablecoinAmount, decimals);
      const minAmountInWei = ethers.utils.parseEther(minZeAmount);
      
      // First, approve the stablecoin transfer
      const stablecoinContract = new ethers.Contract(stablecoinAddress, ERC20_ABI, signer);
      
      // Check current allowance
      const userAddress = await signer.getAddress();
      const currentAllowance = await stablecoinContract.allowance(userAddress, contracts.EXAA_SWAP_ADDRESS);
      
      if (currentAllowance.lt(amountInWei)) {
        console.log('Approving stablecoin transfer...');
        const approveTx = await stablecoinContract.approve(contracts.EXAA_SWAP_ADDRESS, amountInWei);
        await approveTx.wait();
        console.log('Stablecoin approval confirmed');
      }
      
      console.log('Calling buyZe with params:', {
        stablecoinAddress,
        amountInWei: amountInWei.toString(),
        minAmountInWei: minAmountInWei.toString()
      });
      
      // Call buyZe (non-permit version)
      const tx = await swapContract.buyZe(
        stablecoinAddress,
        amountInWei,
        minAmountInWei,
        { gasLimit: 500000 } // Add explicit gas limit to prevent underestimation
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Verify transaction success by checking receipt status
      if (receipt.status === 0) {
        throw new Error('Transaction failed on blockchain');
      }
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error buying ZE tokens:', err);
      setError(err.message || 'Failed to buy ZE tokens');
      setIsLoading(false);
      return false;
    }
  };

  // Sell ZE tokens for stablecoins
  const sellZe = async (zeAmount: string, stablecoinAddress: string, minStablecoinAmount: string): Promise<boolean> => {
    if (!swapContract || !isConnected || !signer || !tokenContract) {
      setError('Wallet not connected or contract not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      
      const networkConfig = getNetworkConfig(currentNetwork.id);
      const contracts = networkConfig.contracts;
      
      // Verify contract exists at the address
      if (!signer.provider) {
        throw new Error('Provider not available');
      }
      const code = await signer.provider.getCode(contracts.EXAA_SWAP_ADDRESS);
      if (code === '0x' || code === '0x0') {
        throw new Error(`No contract found at address ${contracts.EXAA_SWAP_ADDRESS}`);
      }
      
      const zeAmountInWei = ethers.utils.parseEther(zeAmount);
      // Get stablecoin decimals from contract
      const decimals = await getStablecoinDecimals(stablecoinAddress);
      const minAmountInWei = ethers.utils.parseUnits(minStablecoinAmount, decimals);
      
      // First, approve the ZE token transfer
      const userAddress = await signer.getAddress();
      const currentAllowance = await tokenContract.allowance(userAddress, contracts.EXAA_SWAP_ADDRESS);
      
      if (currentAllowance.lt(zeAmountInWei)) {
        console.log('Approving ZE token transfer...');
        const approveTx = await tokenContract.approve(contracts.EXAA_SWAP_ADDRESS, zeAmountInWei);
        await approveTx.wait();
        console.log('ZE token approval confirmed');
      }
      
      console.log('Calling sellZe with params:', {
        stablecoinAddress,
        zeAmountInWei: zeAmountInWei.toString(),
        minAmountInWei: minAmountInWei.toString()
      });
      
      // Call sellZe (non-permit version)
      const tx = await swapContract.sellZe(
        stablecoinAddress,
        zeAmountInWei,
        minAmountInWei,
        { gasLimit: 500000 } // Add explicit gas limit to prevent underestimation
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Verify transaction success by checking receipt status
      if (receipt.status === 0) {
        throw new Error('Transaction failed on blockchain');
      }
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error selling ZE tokens:', err);
      setError(err.message || 'Failed to sell ZE tokens');
      setIsLoading(false);
      return false;
    }
  };

  // Calculate ZE amount out for a given stablecoin input
  const calculateZeAmountOut = async (stablecoinAddress: string, stablecoinAmount: string): Promise<string> => {
    if (!swapContract) {
      return '0';
    }

    try {
      // Get ZE price in USD
      const priceInWei = await swapContract.zePriceInUsd();
      const zePrice = parseFloat(ethers.utils.formatEther(priceInWei));
      
      // Calculate ZE amount: stablecoin amount (USD) / ZE price (USD)
      const stablecoinAmountFloat = parseFloat(stablecoinAmount);
      const zeAmountOut = stablecoinAmountFloat / zePrice;
      
      return zeAmountOut.toString();
    } catch (err: any) {
      console.error('Error calculating ZE amount out:', err);
      return '0';
    }
  };

  // Calculate stablecoin amount out for a given ZE input
  const calculateStablecoinAmountOut = async (zeAmount: string, stablecoinAddress: string): Promise<string> => {
    if (!swapContract) {
      return '0';
    }

    try {
      // Get ZE price in USD
      const priceInWei = await swapContract.zePriceInUsd();
      const zePrice = parseFloat(ethers.utils.formatEther(priceInWei));
      
      // Calculate stablecoin amount: ZE amount * ZE price (USD)
      const zeAmountFloat = parseFloat(zeAmount);
      const stablecoinAmountOut = zeAmountFloat * zePrice;
      
      return stablecoinAmountOut.toString();
    } catch (err: any) {
      console.error('Error calculating stablecoin amount out:', err);
      return '0';
    }
  };

  // Get current ZE price in USD (legacy)
  const getZePriceLegacy = async (): Promise<string> => {
    if (!swapContract) {
      return '0.16'; // Default price
    }

    try {
      const priceInWei = await swapContract.zePriceInUsd();
      return ethers.utils.formatEther(priceInWei);
    } catch (err: any) {
      console.error('Error getting ZE price:', err);
      return '0.16'; // Default price
    }
  };





  // Generate permit signature for EIP-2612 tokens


  // Helper function to get stablecoin decimals
  const getStablecoinDecimals = async (stablecoinAddress: string): Promise<number> => {
    try {
      if (!swapContract) return 18; // Default to 18 if contract not available
      
      // Try to get decimals from the stablecoin contract
      if (!signer) return 18;
      const stablecoinContract = new ethers.Contract(stablecoinAddress, ERC20_ABI, signer);
      return await stablecoinContract.decimals();
    } catch (error) {
      console.error("Error getting stablecoin decimals:", error);
      return 18; // Default to 18 decimals
    }
  };





  // Get ZE price directly from contract
  const getZePrice = async (): Promise<string> => {
    if (!swapContract) {
      console.warn("Contract not initialized, returning fallback ZE price");
      return "0.16"; // Fallback price
    }

    try {
      const zePriceWei = await retryContractCall(
        () => swapContract.zePriceInUsd(),
        2, // Reduced retries for faster response
        500, // Shorter delay
        "Getting ZE price"
      );
      return ethers.utils.formatUnits(zePriceWei as ethers.BigNumberish, 18);
    } catch (error: any) {
      const errorMessage = handleRpcError(error, "Error getting ZE price");
      console.warn(errorMessage, "- Using fallback price");
      return "0.16"; // Fallback price instead of "0"
    }
  };

  // Get list of supported stablecoins
  const getStablecoinList = async (): Promise<{address: string, symbol: string, decimals: number}[]> => {
    const networkConfig = getNetworkConfig(currentNetwork.id);
    const contracts = networkConfig.contracts;
    
    // Fallback stablecoin list for when contract calls fail
    const fallbackStablecoins = [
      { address: contracts.USDT_TOKEN_ADDRESS, symbol: 'USDT', decimals: 6 },
      { address: contracts.USDC_TOKEN_ADDRESS, symbol: 'USDC', decimals: 6 }
    ].filter(coin => coin.address !== '0x0000000000000000000000000000000000000000');

    if (!swapContract) {
      console.warn("Contract not initialized, returning fallback stablecoin list");
      return fallbackStablecoins;
    }

    try {
      // Use predefined stablecoin addresses and check if they're supported
      const predefinedStablecoins = [
        { address: contracts.USDT_TOKEN_ADDRESS, symbol: 'USDT', decimals: 6 },
        { address: contracts.USDC_TOKEN_ADDRESS, symbol: 'USDC', decimals: 6 },
        { address: contracts.BUSD_TOKEN_ADDRESS, symbol: 'BUSD', decimals: 18 }
      ];

      // Filter out zero addresses and check if they're supported by the contract
      const supportedStablecoins = await Promise.all(
        predefinedStablecoins
          .filter(coin => coin.address !== '0x0000000000000000000000000000000000000000')
          .map(async (coin) => {
            try {
              // Try to check if the stablecoin is supported by calling the supportedStablecoins mapping with retry
              const stablecoinInfo = await retryContractCall(
                () => swapContract.supportedStablecoins(coin.address),
                2, // Reduced retries for faster fallback
                500, // Shorter delay
                `Checking stablecoin ${coin.symbol}`
              );
              
              if (stablecoinInfo && (stablecoinInfo as any).isSupported) {
                return {
                  address: coin.address,
                  symbol: coin.symbol,
                  decimals: (stablecoinInfo as any).decimals || coin.decimals
                };
              }
              // If not supported by contract, still include it in fallback mode
              return {
                address: coin.address,
                symbol: coin.symbol,
                decimals: coin.decimals
              };
            } catch (error) {
              const errorMessage = handleRpcError(error, `Error checking stablecoin ${coin.address}`);
              console.warn(errorMessage);
              // Return the coin with default values as fallback
              return {
                address: coin.address,
                symbol: coin.symbol,
                decimals: coin.decimals
              };
            }
          })
      );
      
      // Filter out null values and return the supported stablecoins
      const validStablecoins = supportedStablecoins.filter(coin => coin !== null) as {address: string, symbol: string, decimals: number}[];
      return validStablecoins.length > 0 ? validStablecoins : fallbackStablecoins;
    } catch (error: any) {
      const errorMessage = handleRpcError(error, "Error getting stablecoin list");
      console.warn(errorMessage, "- Using fallback stablecoin list");
      return fallbackStablecoins;
    }
  };

  return (
    <ContractContext.Provider
      value={{
          stakingContract,
          tokenContract,
          swapContract,
          usdtContract,
          busdContract,
          usdcContract,
          fusdContract,
          ethContract,
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
          buyZe,
          sellZe,
          calculateZeAmountOut,
          calculateStablecoinAmountOut,
          getZePrice,
          getStablecoinList,
          swapTokens,
          getTokenPrice,
          getAmountOut
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