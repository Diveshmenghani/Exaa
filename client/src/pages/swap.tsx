import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COIN_TICKER } from '@/lib/branding';
import { Loader2 } from 'lucide-react';

// Token addresses from contract hook
const ZE_TOKEN_ADDRESS = '0x00140Dc2155aA4197B88464aC8fee02D161f76fa'; // ZE token on Holesky
const USDT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // USDT placeholder
const BUSD_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // BUSD placeholder
const USDC_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // USDC placeholder
const FUSD_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // FUSD placeholder

// Default stablecoin options (will be replaced with dynamic list from contract)
const defaultStablecoinOptions = [
  { id: 'USDT', name: 'Tether USD', address: USDT_TOKEN_ADDRESS, icon: '$', decimals: 6, color: 'bg-green-500' },
  { id: 'USDC', name: 'USD Coin', address: USDC_TOKEN_ADDRESS, icon: 'C', decimals: 6, color: 'bg-blue-500' }
];

// ZE token option
const zeToken = { id: 'ZE', name: 'ZE Token', address: ZE_TOKEN_ADDRESS, icon: 'Z', decimals: 18, color: 'bg-blue-600' };

// Coming soon tokens (dynamic pricing)
const comingSoonTokens = [
  { id: 'BTC', name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
  { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'bg-gray-500' }
];

export default function Swap() {
  // Contract hooks - using new ExaaSwap functions with permit
  const { 
    buyZe, 
    sellZe,
    buyZeWithPermit,
    sellZeWithPermit,
    calculateZeAmountOut, 
    calculateStablecoinAmountOut, 
    getZePrice,
    getStablecoinList,
    getTokenBalance
  } = useContract();
  
  // State variables
  const [sendAmount, setSendAmount] = useState('');
  const [getAmount, setGetAmount] = useState('');
  const [stablecoinOptions, setStablecoinOptions] = useState(defaultStablecoinOptions);
  const [selectedStablecoin, setSelectedStablecoin] = useState(defaultStablecoinOptions[0]); // Default to first option
  const [swapDirection, setSwapDirection] = useState<'buy' | 'sell'>('buy'); // buy = stablecoin -> ZE, sell = ZE -> stablecoin
  const [isSwapping, setIsSwapping] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [zePrice, setZePrice] = useState('0.16'); // Default ZE price
  const [sendUsdValue, setSendUsdValue] = useState('0.00');
  const [getUsdValue, setGetUsdValue] = useState('0.00');
  const [slippagePercent, setSlippagePercent] = useState(0.5); // Default 0.5% slippage
  const [zeBalance, setZeBalance] = useState('0');
  const [stablecoinBalance, setStablecoinBalance] = useState('0');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();

  // Fetch ZE price, stablecoin list, and balances on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingPrice(true);
      setIsLoadingBalances(true);
      
      try {
        // Fetch ZE price
        const price = await getZePrice();
        setZePrice(price);
        console.log('ZE price fetched from contract:', price);
        
        // Fetch supported stablecoins from contract
        const stablecoins = await getStablecoinList();
        if (stablecoins && stablecoins.length > 0) {
          const formattedStablecoins = stablecoins.map((coin: {address: string, symbol: string, decimals: number}) => {
            // Map colors based on symbol or use default colors
            let color = 'bg-blue-500';
            let icon = coin.symbol.charAt(0);
            
            if (coin.symbol.includes('USDT')) {
              color = 'bg-green-500';
              icon = '$';
            } else if (coin.symbol.includes('USDC')) {
              color = 'bg-blue-500';
              icon = 'C';
            }
            
            return {
              id: coin.symbol,
              name: coin.symbol,
              address: coin.address,
              icon: icon,
              decimals: coin.decimals,
              color: color
            };
          });
          
          setStablecoinOptions(formattedStablecoins);
          setSelectedStablecoin(formattedStablecoins[0]);
          console.log('Stablecoin list fetched from contract:', formattedStablecoins);
        }
        
        // Fetch ZE balance
        if (walletAddress) {
          const zeBalanceResult = await getTokenBalance(ZE_TOKEN_ADDRESS);
          setZeBalance(zeBalanceResult);
          console.log('ZE balance fetched:', zeBalanceResult);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        toast({
          title: 'Data Fetch Failed',
          description: 'Unable to fetch current data from smart contract. Using default values.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPrice(false);
        setIsLoadingBalances(false);
      }
    };

    if (isConnected) {
      fetchInitialData();
    }
  }, [getZePrice, getStablecoinList, getTokenBalance, toast, isConnected, walletAddress]);

  // Calculate equivalent amount using smart contract's calculation functions
  useEffect(() => {
    const calculateAmountOut = async () => {
      if (sendAmount && !isNaN(parseFloat(sendAmount)) && parseFloat(sendAmount) > 0 && isConnected) {
        try {
          let expectedAmountOut = '0';
          
          if (swapDirection === 'buy') {
            // Buying ZE with stablecoin
            expectedAmountOut = await calculateZeAmountOut(selectedStablecoin.address, sendAmount);
            
            // Calculate USD values
            const sendValueInUsd = parseFloat(sendAmount); // Stablecoin is 1:1 with USD
            const getValueInUsd = parseFloat(expectedAmountOut) * parseFloat(zePrice);
            
            setSendUsdValue(sendValueInUsd.toFixed(2));
            setGetUsdValue(getValueInUsd.toFixed(2));
          } else {
            // Selling ZE for stablecoin
            expectedAmountOut = await calculateStablecoinAmountOut(sendAmount, selectedStablecoin.address);
            
            // Calculate USD values
            const sendValueInUsd = parseFloat(sendAmount) * parseFloat(zePrice);
            const getValueInUsd = parseFloat(expectedAmountOut); // Stablecoin is 1:1 with USD
            
            setSendUsdValue(sendValueInUsd.toFixed(2));
            setGetUsdValue(getValueInUsd.toFixed(2));
          }
          
          setGetAmount(expectedAmountOut);
        } catch (error) {
          console.error('Failed to calculate amount out:', error);
          setGetAmount('0');
          setSendUsdValue('0.00');
          setGetUsdValue('0.00');
        }
      } else {
        setGetAmount('');
        setSendUsdValue('0.00');
        setGetUsdValue('0.00');
      }
    };

    calculateAmountOut();
  }, [sendAmount, swapDirection, selectedStablecoin, zePrice, calculateZeAmountOut, calculateStablecoinAmountOut, isConnected]);

  // Handle send amount change
  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
  };

  // Handle get amount change (manual override - user can specify exact output amount)
  const handleGetAmountChange = (value: string) => {
    setGetAmount(value);
    // Calculate USD value based on swap direction
    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      if (swapDirection === 'buy') {
        // Getting ZE tokens
        const getValueInUsd = parseFloat(value) * parseFloat(zePrice);
        setGetUsdValue(getValueInUsd.toFixed(2));
      } else {
        // Getting stablecoins
        const getValueInUsd = parseFloat(value); // Stablecoin is 1:1 with USD
        setGetUsdValue(getValueInUsd.toFixed(2));
      }
    } else {
      setGetUsdValue('0.00');
    }
  };

  // Handle stablecoin selection change
  const handleStablecoinChange = async (value: string) => {
    const newStablecoin = stablecoinOptions.find(s => s.id === value) || stablecoinOptions[0];
    setSelectedStablecoin(newStablecoin);
    
    // Fetch balance of selected stablecoin
    if (isConnected && walletAddress) {
      setIsLoadingBalances(true);
      try {
        const balance = await getTokenBalance(newStablecoin.address);
        setStablecoinBalance(balance);
        console.log(`${newStablecoin.id} balance fetched:`, balance);
      } catch (error) {
        console.error(`Failed to fetch ${newStablecoin.id} balance:`, error);
        setStablecoinBalance('0');
      } finally {
        setIsLoadingBalances(false);
      }
    }
  };

  // Swap direction (buy ZE vs sell ZE)
  const handleSwapDirection = () => {
    setSwapDirection(swapDirection === 'buy' ? 'sell' : 'buy');
    
    // Clear amounts when switching direction
    setSendAmount('');
    setGetAmount('');
    setSendUsdValue('0.00');
    setGetUsdValue('0.00');
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!isConnected || !walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to proceed.',
        variant: 'destructive',
      });
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (!getAmount || parseFloat(getAmount) <= 0) {
      toast({
        title: 'Invalid Output Amount',
        description: 'Please wait for amount calculation to complete.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSwapping(true);
      
      // Calculate minimum amount out with slippage protection
      const minAmountOut = (parseFloat(getAmount) * (100 - slippagePercent) / 100).toString();
      
      if (swapDirection === 'buy') {
        // Try buyZeWithPermit first (handles approval with EIP-2612 permit)
        toast({
          title: 'Preparing Transaction',
          description: `Please sign the permit message in your wallet to approve ${selectedStablecoin.id} spending.`,
        });
        
        try {
          // First try with permit (gasless approval)
          const success = await buyZeWithPermit(selectedStablecoin.address, sendAmount, minAmountOut);
          
          if (success) {
            toast({
              title: 'Purchase Successful!',
              description: `Successfully bought ${getAmount} ZE tokens with ${sendAmount} ${selectedStablecoin.id}.`,
            });
            
            // Update balances after successful swap
            const zeBalanceResult = await getTokenBalance(ZE_TOKEN_ADDRESS);
            setZeBalance(zeBalanceResult);
            const stablecoinBalanceResult = await getTokenBalance(selectedStablecoin.address);
            setStablecoinBalance(stablecoinBalanceResult);
          } else {
            throw new Error('Transaction failed or was rejected');
          }
        } catch (permitError) {
          console.error('Permit method failed, falling back to regular swap:', permitError);
          
          toast({
            title: 'Permit Failed',
            description: 'Falling back to regular approval. Please approve the token spending in your wallet...',
          });
          
          // Fallback to regular buyZe if permit fails
          const success = await buyZe(selectedStablecoin.address, sendAmount, minAmountOut);
          
          if (success) {
            toast({
              title: 'Purchase Successful!',
              description: `Successfully bought ${getAmount} ZE tokens with ${sendAmount} ${selectedStablecoin.id}.`,
            });
            
            // Update balances after successful swap
            const zeBalanceResult = await getTokenBalance(ZE_TOKEN_ADDRESS);
            setZeBalance(zeBalanceResult);
            const stablecoinBalanceResult = await getTokenBalance(selectedStablecoin.address);
            setStablecoinBalance(stablecoinBalanceResult);
          } else {
            throw new Error('Transaction failed or was rejected');
          }
        }
      } else {
        // Try sellZeWithPermit first (handles approval with EIP-2612 permit)
        toast({
          title: 'Preparing Transaction',
          description: `Please sign the permit message in your wallet to approve ZE token spending.`,
        });
        
        try {
          // First try with permit (gasless approval)
          const success = await sellZeWithPermit(sendAmount, selectedStablecoin.address, minAmountOut);
          
          if (success) {
            toast({
              title: 'Sale Successful!',
              description: `Successfully sold ${sendAmount} ZE tokens for ${getAmount} ${selectedStablecoin.id}.`,
            });
            
            // Update balances after successful swap
            const zeBalanceResult = await getTokenBalance(ZE_TOKEN_ADDRESS);
            setZeBalance(zeBalanceResult);
            const stablecoinBalanceResult = await getTokenBalance(selectedStablecoin.address);
            setStablecoinBalance(stablecoinBalanceResult);
          } else {
            throw new Error('Transaction failed or was rejected');
          }
        } catch (permitError) {
          console.error('Permit method failed, falling back to regular swap:', permitError);
          
          toast({
            title: 'Permit Failed',
            description: 'Falling back to regular approval. Please approve the token spending in your wallet...',
          });
          
          // Fallback to regular sellZe if permit fails
          const success = await sellZe(sendAmount, selectedStablecoin.address, minAmountOut);
          
          if (success) {
            toast({
              title: 'Sale Successful!',
              description: `Successfully sold ${sendAmount} ZE tokens for ${getAmount} ${selectedStablecoin.id}.`,
            });
            
            // Update balances after successful swap
            const zeBalanceResult = await getTokenBalance(ZE_TOKEN_ADDRESS);
            setZeBalance(zeBalanceResult);
            const stablecoinBalanceResult = await getTokenBalance(selectedStablecoin.address);
            setStablecoinBalance(stablecoinBalanceResult);
          } else {
            throw new Error('Transaction failed or was rejected');
          }
        }
      }
      
      // Reset form
      setSendAmount('');
      setGetAmount('');
      setSendUsdValue('0.00');
      setGetUsdValue('0.00');
      
    } catch (error: any) {
      console.error('Swap failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to complete the swap. Please try again.';
      
      if (error.message) {
        if (error.message.includes('contract') || error.message.includes('address')) {
          errorMessage = 'Failed to connect to the swap contract. Please check your network connection and try again.';
        } else if (error.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected. Please try again.';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas estimation. Try with a smaller amount.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for this transaction. Please check your balance.';
        } else if (error.message.includes('slippage')) {
          errorMessage = 'Price moved beyond slippage tolerance. Try increasing slippage or reducing amount.';
        }
      }
      
      toast({
        title: 'Swap Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Token Swap
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">Exchange tokens instantly at the best rates</p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="bg-black border-gray-800">
            <CardContent className="space-y-6 pt-6">
              {/* SEND Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg font-bold text-white block">SEND</Label>
                  <div className="text-sm text-gray-500">
                    Balance: {isLoadingBalances ? (
                      <span>Loading...</span>
                    ) : (
                      <span>
                        {swapDirection === 'buy' 
                          ? `${parseFloat(stablecoinBalance).toFixed(4)} ${selectedStablecoin.id}`
                          : `${parseFloat(zeBalance).toFixed(4)} ZE`}
                      </span>
                    )}
                    {isConnected && (
                      <Button 
                        variant="link" 
                        className="h-auto p-0 ml-1 text-xs text-blue-500" 
                        onClick={() => {
                          if (swapDirection === 'buy') {
                            setSendAmount(stablecoinBalance);
                          } else {
                            setSendAmount(zeBalance);
                          }
                        }}
                      >
                        MAX
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => handleSendAmountChange(e.target.value)}
                    className="bg-transparent border-none text-2xl font-bold text-white outline-none focus:ring-0 flex-1"
                    data-testid="input-send-amount"
                  />
                  {swapDirection === 'buy' ? (
                    // When buying ZE, user sends stablecoin
                    <Select value={selectedStablecoin.id} onValueChange={handleStablecoinChange}>
                      <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                        <SelectValue>
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white ${selectedStablecoin.color}`}>
                              {selectedStablecoin.icon}
                            </div>
                            {selectedStablecoin.id}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {stablecoinOptions.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white ${token.color}`}>
                                {token.icon}
                              </div>
                              {token.id}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    // When selling ZE, user sends ZE
                    <div className="w-[120px] bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white ${zeToken.color}`}>
                          {zeToken.icon}
                        </div>
                        {zeToken.id}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-gray-500 text-sm mt-1">~${sendUsdValue}</div>
              </div>

              {/* Swap Direction Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSwapDirection}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full w-10 h-10"
                  data-testid="button-swap-direction"
                >
                  ↑↓
                </Button>
              </div>

              {/* GET Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg font-bold text-white block">GET</Label>
                  <div className="text-sm text-gray-500">
                    Balance: {isLoadingBalances ? (
                      <span>Loading...</span>
                    ) : (
                      <span>
                        {swapDirection === 'buy' 
                          ? `${parseFloat(zeBalance).toFixed(4)} ZE`
                          : `${parseFloat(stablecoinBalance).toFixed(4)} ${selectedStablecoin.id}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={getAmount}
                    onChange={(e) => handleGetAmountChange(e.target.value)}
                    className="bg-transparent border-none text-2xl font-bold text-white outline-none focus:ring-0 flex-1"
                    data-testid="input-get-amount"
                  />
                  {swapDirection === 'buy' ? (
                    // When buying ZE, user gets ZE
                    <div className="w-[120px] bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white ${zeToken.color}`}>
                          {zeToken.icon}
                        </div>
                        {zeToken.id}
                      </div>
                    </div>
                  ) : (
                    // When selling ZE, user gets stablecoin
                    <Select value={selectedStablecoin.id} onValueChange={handleStablecoinChange}>
                      <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                        <SelectValue>
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white ${selectedStablecoin.color}`}>
                              {selectedStablecoin.icon}
                            </div>
                            {selectedStablecoin.id}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {stablecoinOptions.map((token) => (
                          <SelectItem key={token.id} value={token.id}>
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white ${token.color}`}>
                                {token.icon}
                              </div>
                              {token.id}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="text-gray-500 text-sm mt-1">~${getUsdValue}</div>
              </div>

              {/* Slippage Settings */}
              <div className="p-4 bg-gray-900 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-medium">Slippage Tolerance</span>
                  <span className="text-gray-400 text-sm">{slippagePercent}%</span>
                </div>
                <div className="flex space-x-2">
                  {[0.1, 0.5, 1.0].map((percent) => (
                    <Button
                      key={percent}
                      onClick={() => setSlippagePercent(percent)}
                      variant={slippagePercent === percent ? "default" : "outline"}
                      className={`flex-1 text-sm ${
                        slippagePercent === percent 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
                      }`}
                    >
                      {percent}%
                    </Button>
                  ))}
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Custom"
                      value={slippagePercent}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 50) {
                          setSlippagePercent(value);
                        }
                      }}
                      className="bg-gray-800 border-gray-600 text-white text-sm text-center"
                      step="0.1"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
                <div className="text-gray-500 text-xs mt-2">
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </div>
              </div>

              {/* Price Info */}
               {isLoadingPrice ? (
                 <div className="flex justify-center items-center p-4 bg-gray-900 rounded-xl">
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                   <span className="text-gray-400">Loading ZE price...</span>
                 </div>
               ) : (
                 <div className="p-4 bg-gray-900 rounded-xl text-sm">
                   <div className="text-gray-400 mb-2">Current ZE Price:</div>
                   <div className="text-white text-lg font-semibold">
                     1 ZE = ${zePrice ? parseFloat(zePrice).toFixed(4) : '0.1600'} USD
                   </div>
                   <div className="text-gray-400 text-xs mt-1">
                     Stablecoins are pegged 1:1 to USD
                   </div>
                 </div>
               )}

               {/* Exchange Button */}
               <Button
                 onClick={handleSwap}
                 disabled={isSwapping || isLoadingPrice || !sendAmount || parseFloat(sendAmount) <= 0 || !isConnected}
                 className="w-full py-6 text-xl font-bold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                 data-testid="button-swap"
               >
                 {isLoadingPrice ? (
                   <>
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Price...
                   </>
                 ) : isSwapping ? (
                   <>
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {swapDirection === 'buy' ? 'Buying ZE...' : 'Selling ZE...'}
                   </>
                 ) : !isConnected ? (
                   "Connect Wallet"
                 ) : (
                   swapDirection === 'buy' ? `Buy ZE with ${selectedStablecoin.id}` : `Sell ZE for ${selectedStablecoin.id}`
                 )}
               </Button>

               {/* Exchange Rate - Small text below button */}
               <div className="text-center text-sm text-gray-500">
                 {isLoadingPrice ? (
                   <span>Loading exchange rate...</span>
                 ) : zePrice ? (
                   <span>
                     Exchange Rate: 1 ZE = ${parseFloat(zePrice).toFixed(4)} USD
                   </span>
                 ) : (
                   <span>Exchange Rate: 1 ZE = $0.1600 USD</span>
                 )}
               </div>
            </CardContent>
          </Card>

          {/* Coming Soon Section */}
          <Card className="bg-black border-gray-800 mt-8">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Coming Soon</h3>
                <p className="text-gray-400">Dynamic pricing for popular cryptocurrencies</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {comingSoonTokens.map((token) => (
                  <div key={token.id} className="p-4 bg-gray-900 rounded-xl border border-gray-800 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white ${token.color}`}>
                          {token.icon}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{token.id}</div>
                          <div className="text-gray-400 text-sm">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm font-medium">Soon</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-6">
                <p className="text-gray-500 text-sm">
                  These tokens will be available for swapping with dynamic market pricing
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
