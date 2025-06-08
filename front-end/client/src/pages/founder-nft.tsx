// Updated HeroAndMintSection component with ethers.js integration
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import { useFounderNFT } from "@/hooks/useFounderNFT"; // Our new ethers.js hook
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import gsap from "gsap";
import founderNftVideo from "../assets/videos/FounderNFT.mp4";

export default function FounderNFT () {
  const nftImageRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [gasEstimate, setGasEstimate] = useState<string>("0.005");
  
  const { isConnected, connect } = useWallet();
  const { toast } = useToast();
  
  // Use our ethers.js hook
  const {
    price,
    totalSupply,
    maxSupply,
    userBalance,
    isLoading: contractLoading,
    error: contractError,
    mintMultiple,
    debugMintMultiple,
    mintState,
    resetMintState,
    //estimateGas,
    //calculateTotalCost,
    refreshData,
    isContractReady,
  } = useFounderNFT();

  // GSAP animations
  useEffect(() => {
    const tl = gsap.timeline();

    if (nftImageRef.current && textContentRef.current) {
      tl.from(nftImageRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      }).from(
        textContentRef.current.children,
        {
          y: 30,
          opacity: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5",
      );
    }
  }, []);

  // Video playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }

    const handleVideoLoad = () => {
      if (videoRef.current) {
        videoRef.current.playbackRate = 0.5;
      }
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener("loadeddata", handleVideoLoad);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("loadeddata", handleVideoLoad);
      }
    };
  }, []);

  // Update gas estimate when quantity changes
/*   useEffect(() => {
    const updateGasEstimate = async () => {
      if (isContractReady && quantity > 0) {
        try {
          const estimate = await estimateGas(quantity);
          if (estimate) {
            setGasEstimate(estimate.gasCost);
          }
        } catch (error) {
          console.error("Failed to estimate gas:", error);
        }
      }
    }; 

    updateGasEstimate();
  }, [quantity, isContractReady, estimateGas]);*/

  // Show toast when mint state changes
  useEffect(() => {
    if (mintState.status === 'success') {
      toast({
        title: "NFT Minted Successfully! 🎉",
        description: `You've successfully minted ${quantity} Founder NFT${quantity > 1 ? "s" : ""}!`,
      });
    } else if (mintState.status === 'error' && mintState.error) {
      toast({
        title: "Minting Failed",
        description: mintState.error,
        variant: "destructive",
      });
    }
  }, [mintState.status, mintState.error, quantity, toast]);

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      try {
        await connect();
        return;
      } catch (error) {
        toast({
          title: "Wallet Connection Failed",
          description: "Please try connecting your wallet again.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!isContractReady) {
      toast({
        title: "Contract Not Ready",
        description: "Please wait for the contract to load.",
        variant: "destructive",
      });
      return;
    }

    try {
      const debugResult = await debugMintMultiple(quantity);
      console.log('Debug result:', debugResult);
      if (!debugResult.error) {
         resetMintState();
      await mintMultiple(quantity);
      }
      //resetMintState();
      //await mintMultiple(quantity);
    } catch (error: any) {
      // Error handling is done in the hook and useEffect above
      console.error("Mint error:", error);
    }
  };

  // Calculate supply percentage
  const supplyPercentage = maxSupply > 0 ? (totalSupply / maxSupply) * 100 : 0;

  // Calculate total cost
  const totalMintCost = parseFloat(price) * quantity;
  const totalCostWithGas = totalMintCost+ parseFloat(gasEstimate);

  return (
    <section className="w-full py-16 md:py-24 lg:py-28 bg-white dark:bg-[#111827] text-black dark:text-white">
      <div className="container mx-auto px-12 sm:px-16 lg:px-20 max-w-[110rem]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side: NFT Showcase and Info */}
          <div>
            <div ref={textContentRef} className="space-y-6 mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-black dark:text-white">
                Founder NFT
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Become a Founder of the Frami platform and receive exclusive
                rewards such as fee distribution, governance features and early
                access to premium projects and products.
              </p>
            </div>

            <div ref={nftImageRef} className="flex justify-center">
              <div className="max-w-xs mx-auto w-full relative">
                {/* Hexagonal frame with purple glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#8A63D2]/30 to-[#583c8e]/30 rounded-3xl blur-md"></div>

                {/* Main card container with border */}
                <div className="relative bg-white dark:bg-[#1a1e31] border border-[#f0d795]/30 rounded-3xl p-3 pb-6 shadow-xl overflow-hidden">
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#f0d795] rounded-tl-3xl opacity-60"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#f0d795] rounded-tr-3xl opacity-60"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#f0d795] rounded-bl-3xl opacity-60"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#f0d795] rounded-br-3xl opacity-60"></div>

                  {/* Golden hexagon border */}
                  <div className="w-full aspect-square relative">
                    <div className="absolute inset-[5%] border-2 border-[#f0d795]/70 rounded-xl transform rotate-45 pointer-events-none"></div>
                    <div className="absolute inset-[5%] border-2 border-[#f0d795]/70 rounded-xl transform -rotate-45 pointer-events-none"></div>

                    {/* Video content */}
                    <div className="absolute inset-[10%] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        src={founderNftVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain relative z-10"
                      />
                    </div>

                    {/* Gold speckles decoration */}
                    <div className="absolute top-2 right-2 w-8 h-8 bg-[#f0d795]/10 rounded-full blur-sm"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 bg-[#f0d795]/10 rounded-full blur-sm"></div>

                    {/* Badge */}
                    <div className="absolute bottom-[-10px] w-full flex justify-center z-20">
                      <div className="bg-black/70 text-white dark:text-white px-4 py-1 rounded-full text-sm border border-[#f0d795]/30 backdrop-blur-sm">
                        Exclusive Collection
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Stats and Minting Interface */}
          <div className="space-y-6 mt-8 lg:mt-0">
            {/* NFT Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1a1e31] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Supply
                </div>
                <div className="text-xl font-bold text-black dark:text-white">
                  {contractLoading ? "Loading..." : `${totalSupply} / ${maxSupply}`}
                </div>
                <Progress 
                  value={supplyPercentage} 
                  className="h-1.5 mt-2 bg-[#8A63D2]/50" 
                />
              </div>
              <div className="bg-white dark:bg-[#1a1e31] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Price
                </div>
                <div className="text-xl font-bold text-black dark:text-white">
                  {contractLoading ? "Loading..." : `${price} ETH`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                  ≈ ${(parseFloat(price) * 2500).toFixed(0)} USD
                </div>
              </div>
            </div>

            {/* Contract Error Display */}
            {contractError && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
                <div className="flex items-center text-red-800 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{contractError}</span>
                </div>
              </div>
            )}

            {/* User's NFT Balance */}
            {isConnected && userBalance > 0 && (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3">
                <div className="flex items-center text-green-800 dark:text-green-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">You own {userBalance} Founder NFT{userBalance > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            {/* Minting Interface */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden bg-white dark:bg-[#1a1e31] text-black dark:text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">
                  Mint Your Founder NFT
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-300">
                  Select quantity and review gas fees before minting
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Quantity Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Quantity
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden bg-gray-50 dark:bg-[#111827] w-1/5 mx-auto">
                      <button
                        onClick={decrementQuantity}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors border-r border-gray-300 dark:border-gray-700"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center py-1 text-black dark:text-white">
                        {quantity}
                      </div>
                      <button
                        onClick={incrementQuantity}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors border-l border-gray-300 dark:border-gray-700"
                        disabled={quantity >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price Information */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Price per NFT
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {price} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Quantity
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      x{quantity}
                    </span>
                  </div>
{/*                   <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Estimated Gas Fee
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      ~{gasEstimate} ETH
                    </span>
                  </div> */}
                  <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-700 dark:text-gray-200">
                        Total
                      </span>
                      <span className="text-black dark:text-white">
                        {totalMintCost.toFixed(2)} ETH
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Status */}
                {mintState.status !== 'idle' && (
                  <div
                    className={`p-3 rounded-md ${
                      mintState.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        : mintState.status === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    }`}
                  >
                    <div className="flex items-center">
                      {mintState.status === "pending" && (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {mintState.status === "success" && (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {mintState.status === "error" && (
                        <AlertCircle className="h-4 w-4 mr-2" />
                      )}
                      <div className="flex-1">
                        <div>
                          {mintState.status === "pending" && "Transaction in progress..."}
                          {mintState.status === "success" && "Transaction successful!"}
                          {mintState.status === "error" && (mintState.error || "Transaction failed")}
                        </div>
                        {mintState.transactionHash && (
                          <div className="mt-1">
                            <a
                              href={`http://localhost:8545/tx/${mintState.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm underline flex items-center"
                            >
                              View Transaction <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  onClick={handleMint}
                  className="w-[30%] mx-auto bg-[#8A63D2] hover:bg-[#7651c0] text-white text-sm rounded-md py-1.5 h-auto shadow-md"
                  disabled={mintState.isLoading || contractLoading || !isContractReady}
                >
                  {!isConnected
                    ? "Connect Wallet to Mint"
                    : !isContractReady
                      ? "Loading Contract..."
                      : mintState.isLoading
                        ? "Processing..."
                        : `Mint ${quantity > 1 ? quantity + " NFTs" : "1 NFT"}`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};