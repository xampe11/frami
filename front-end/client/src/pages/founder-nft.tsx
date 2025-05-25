import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  PieChart,
  Users,
  VoteIcon,
  Clock,
  Info,
  AlertCircle,
} from "lucide-react";
import gsap from "gsap";
import founderNftVideo from "../assets/videos/FounderNFT.mp4";

// Combined Hero & Mint Section component
const HeroAndMintSection = () => {
  const nftImageRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    null | "pending" | "success" | "error"
  >(null);
  const { isConnected, connect } = useWallet();
  const { toast } = useToast();

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

  // Set video playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }

    // Add event listener to reset playback rate after video loads
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

    setIsMinting(true);
    setTransactionStatus("pending");

    // Simulate transaction
    setTimeout(() => {
      setIsMinting(false);
      setTransactionStatus("success");
      toast({
        title: "NFT Minted Successfully",
        description: `You've successfully minted ${quantity} Founder NFT${quantity > 1 ? "s" : ""}!`,
      });
    }, 2000);
  };

  return (
    <section className="w-full py-16 md:py-24 lg:py-28 bg-white dark:bg-[#111827] text-black dark:text-white">
      <div className="container mx-auto px-10 max-w-[110rem]">
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
                  {/* Decorative top corners */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#f0d795] rounded-tl-3xl opacity-60"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#f0d795] rounded-tr-3xl opacity-60"></div>

                  {/* Bottom corners */}
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
            {/* NFT Stats - moved here */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1a1e31] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Supply
                </div>
                <div className="text-xl font-bold text-black dark:text-white">
                  1,000 / 1,000
                </div>
                <Progress value={100} className="h-1.5 mt-2 bg-[#8A63D2]/50" />
              </div>
              <div className="bg-white dark:bg-[#1a1e31] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Price
                </div>
                <div className="text-xl font-bold text-black dark:text-white">
                  0.1 ETH
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                  ≈ $250 USD
                </div>
              </div>
            </div>

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
                      0.1 ETH
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Estimated Gas Fee
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      ~0.005 ETH
                    </span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-700 dark:text-gray-200">
                        Total
                      </span>
                      <span className="text-black dark:text-white">
                        {(quantity * 0.1 + 0.005).toFixed(3)} ETH
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Status */}
                {transactionStatus && (
                  <div
                    className={`p-3 rounded-md ${
                      transactionStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        : transactionStatus === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    }`}
                  >
                    <div className="flex items-center">
                      {transactionStatus === "pending" && (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      {transactionStatus === "success" && (
                        <div className="h-4 w-4 mr-2">✓</div>
                      )}
                      {transactionStatus === "error" && (
                        <AlertCircle className="h-4 w-4 mr-2" />
                      )}
                      <span>
                        {transactionStatus === "pending" &&
                          "Transaction in progress..."}
                        {transactionStatus === "success" &&
                          "Transaction successful!"}
                        {transactionStatus === "error" &&
                          "Transaction failed. Please try again."}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  onClick={handleMint}
                  className="w-[30%] mx-auto bg-[#8A63D2] hover:bg-[#7651c0] text-white text-sm rounded-md py-1.5 h-auto shadow-md"
                  disabled={isMinting}
                >
                  {!isConnected
                    ? "Connect Wallet to Mint"
                    : isMinting
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

// Core Benefits Section
const CoreBenefits = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const items = sectionRef.current.querySelectorAll(".benefit-card");

      gsap.from(items, {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }
  }, []);

  const benefits = [
    {
      title: "Fee Distribution",
      description:
        "Receive a share of platform fees proportional to your NFT holdings.",
      icon: <PieChart className="h-10 w-10 text-primary" />,
    },
    {
      title: "Early Access",
      description:
        "Get priority access to new projects and initiatives before they're available to the general public.",
      icon: <Clock className="h-10 w-10 text-primary" />,
    },
    {
      title: "Governance Rights",
      description:
        "Receive a percentage of the DAO token minting pool once the platform transitions to a decentralized governance structure.",
      icon: <VoteIcon className="h-10 w-10 text-primary" />,
    },
    {
      title: "Premium Features",
      description:
        "Access exclusive platform features, advanced analytics, and priority customer support reserved for Founder NFT holders.",
      icon: <Users className="h-10 w-10 text-primary" />,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-white to-gray-100 dark:from-[#111827] dark:to-[#1a1e31] text-black dark:text-white"
    >
      <div className="container mx-auto px-10 max-w-[110rem]">
        <h2 className="text-3xl font-bold text-center mb-4">Core Benefits</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Each Founder NFT unlocks exclusive benefits that increase in value as
          the platform grows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="benefit-card flex flex-col p-6 bg-white dark:bg-[#0f172a] rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-black dark:text-white"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Platform Development Roadmap section
const PlatformDevelopmentRoadmap = () => {
  return (
    <section className="py-20 dark:bg-[#111827] text-black dark:text-white">
      <div className="container mx-auto px-4 max-w-[110rem]">
        <h2 className="text-3xl font-bold text-center mb-4">
          Platform Development Roadmap
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Our strategic plan for implementing Founder NFT features and benefits.
        </p>

        {/* Roadmap Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto">
          {/* Q2 2025 */}
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1e2b] rounded-xl overflow-hidden">
            {/* Quarter header with dot */}
            <div className="relative bg-[#1a1e2b] p-4 border-b border-gray-700">
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-[#8A63D2]"></div>
              <h3 className="text-xl font-bold ml-8 text-white">Q2 2025</h3>
              <h4 className="text-base text-purple-300 font-medium ml-8">Foundation Launch</h4>
            </div>
            
            {/* Content */}
            <div className="p-4 text-sm">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Website Launch: Intuitive platform for project creation, discovery, and milestone tracking</span>
                </li>
                
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">FounderNFT Launch</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Exclusive first-access to premium projects</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Higher fee sharing for early holders</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Limited collection representing early platform supporters</span>
                    </li>
                  </ul>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Core Functionality: Smart contracts for milestone-based funding, transparent progress tracking</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>First 10 Projects: Curated selection of high-quality inaugural projects</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Security Audit: Comprehensive third-party audit ensuring platform safety</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Community Building: Ambassador program and educational initiatives</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Q3 2025 */}
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1e2b] rounded-xl overflow-hidden">
            {/* Quarter header with dot */}
            <div className="relative bg-[#1a1e2b] p-4 border-b border-gray-700">
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-[#8A63D2]"></div>
              <h3 className="text-xl font-bold ml-8 text-white">Q3 2025</h3>
              <h4 className="text-base text-purple-300 font-medium ml-8">Feature Expansion</h4>
            </div>
            
            {/* Content */}
            <div className="p-4 text-sm">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Token (ERC20) Creator: No-code tool for project-specific tokens</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>NFT (ERC721) Creator: Simple interface for project reward NFTs</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Multi-Currency Support: Add USDC, USDT, and other currencies</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Analytics Dashboard: Real-time project metrics and funding visualization</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Additional Wallet Integrations: Expanded support for popular Web3 wallets</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Q4 2025 */}
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1e2b] rounded-xl overflow-hidden">
            {/* Quarter header with dot */}
            <div className="relative bg-[#1a1e2b] p-4 border-b border-gray-700">
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-[#8A63D2]"></div>
              <h3 className="text-xl font-bold ml-8 text-white">Q4 2025</h3>
              <h4 className="text-base text-purple-300 font-medium ml-8">Advanced Ecosystem</h4>
            </div>
            
            {/* Content */}
            <div className="p-4 text-sm">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">Validator Economy</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Priority validator status for FounderNFT holders</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Enhanced rewards for NFT holders</span>
                    </li>
                  </ul>
                </li>
                
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">FounderNFT Staking</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Compounding rewards system</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Fee distribution proportional to stake</span>
                    </li>
                  </ul>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cross-Chain Bridge: Interoperability between major blockchains</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Reputation System: Dynamic scoring for project creators</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Automated Milestone Verification: AI-assisted validation</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>AI Risk Assessment: Project viability analysis for investor protection</span>
                </li>
                
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">Enhanced Governance</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Voting weight boost for FounderNFT holders</span>
                    </li>
                  </ul>
                </li>
                
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">Whitelist System</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Priority access to high-demand projects for NFT holders</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          {/* Q1 2026 */}
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1e2b] rounded-xl overflow-hidden">
            {/* Quarter header with dot */}
            <div className="relative bg-[#1a1e2b] p-4 border-b border-gray-700">
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-[#8A63D2]"></div>
              <h3 className="text-xl font-bold ml-8 text-white">Q1 2026</h3>
              <h4 className="text-base text-purple-300 font-medium ml-8">Ecosystem Maturity</h4>
            </div>
            
            {/* Content */}
            <div className="p-4 text-sm">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">DAO Implementation</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Enhanced voting power for FounderNFT holders</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Complete decentralization of platform governance</span>
                    </li>
                  </ul>
                </li>
                
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">Extension Economy</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Revenue sharing from extensions to FounderNFT holders</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Early access to new extensions for NFT holders</span>
                    </li>
                  </ul>
                </li>
                
                <li>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">LayerZero Integration</span>
                  </div>
                  <ul className="ml-5 mt-1 space-y-1">
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Cross-chain funding and deployment</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Chain-agnostic governance</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Omnichain NFT compatibility</span>
                    </li>
                    <li className="flex">
                      <span className="mr-2">-</span>
                      <span>Cross-chain fee distribution</span>
                    </li>
                  </ul>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Decentralized Identity: Self-sovereign identity solutions</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Fiat On-ramps: Direct fiat currency contribution options</span>
                </li>
                
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Developer API & SDK: Tools for platform integration and extension</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
          <span className="text-yellow-500 mr-1">★</span> Indicates special benefits for FounderNFT holders. This roadmap is subject to change based on market conditions and community feedback.
        </p>
      </div>
    </section>
  );
};

// FAQ section
const FAQ = () => {
  return (
    <section className="py-20 bg-gradient-to-t from-gray-100 to-white dark:from-[#111827] dark:to-[#1a1e31] text-black dark:text-white">
      <div className="container mx-auto px-10 max-w-[110rem]">
        <h2 className="text-3xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Get answers to the most common questions about our Founder NFTs.
        </p>

        <div className="max-w-3xl mx-auto">
          <Accordion
            type="single"
            collapsible
            className="w-full text-black dark:text-white"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I mint a Founder NFT?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-gray-700 dark:text-gray-300">
                  To mint a Founder NFT, follow these steps:
                </p>
                <ol className="list-decimal pl-5 space-y-1 mb-2 text-gray-700 dark:text-gray-300">
                  <li>
                    Connect your Ethereum wallet (MetaMask, WalletConnect, etc.)
                  </li>
                  <li>
                    Select the desired quantity (1-10 NFTs per transaction)
                  </li>
                  <li>
                    Click the "Mint" button and confirm the transaction in your
                    wallet
                  </li>
                  <li>
                    Wait for the transaction to be confirmed on the blockchain
                  </li>
                </ol>
                <p className="text-gray-700 dark:text-gray-300">
                  Once minted, your NFTs will appear in your connected wallet
                  and can be viewed on popular NFT marketplaces.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                How is the fee distribution calculated?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 dark:text-gray-300">
                  Fee distribution is calculated proportionally based on the
                  number of Founder NFTs you hold. 30% of all platform fees are
                  allocated to the Founder NFT holders pool. Distributions occur
                  on a monthly basis and can be claimed through the platform
                  dashboard.
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  For example, if you own 10 out of 1000 Founder NFTs (1%),
                  you'll receive 1% of the 30% fee allocation, which equals 0.3%
                  of the total platform fees.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                What governance rights do Founder NFT holders have?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 dark:text-gray-300">
                  Founder NFT holders have significant governance rights,
                  including:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-700 dark:text-gray-300">
                  <li>Voting on platform upgrade proposals</li>
                  <li>Participating in feature prioritization</li>
                  <li>Providing input on fee structures</li>
                  <li>
                    Voting on funding allocations for ecosystem development
                  </li>
                </ul>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  Each Founder NFT represents one vote in the governance system.
                  Voting takes place through a secure on-chain mechanism.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>
                Can I sell my Founder NFT on secondary markets?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 dark:text-gray-300">
                  Yes, Founder NFTs are fully transferable ERC-721 tokens that
                  can be sold on secondary markets like OpenSea, Rarible, and
                  LooksRare. All associated benefits transfer with the NFT to
                  the new owner.
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  There is a 5% royalty fee on secondary sales that goes back to
                  the platform treasury, helping to maintain the value of all
                  Founder NFTs by funding ongoing development.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>
                How are Founder NFT benefits activated?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-700 dark:text-gray-300">
                  Founder NFT benefits are automatically activated when you hold
                  the NFT in a connected wallet. There's no need for manual
                  activation.
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  For fee distribution and governance participation, you'll need
                  to connect your wallet to the platform dashboard. Early access
                  benefits are applied automatically when new projects launch on
                  the platform.
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  In some cases, you may need to stake your NFT to access
                  specific benefits, which will be clearly communicated when
                  those features become available.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

// Main FounderNFT page component
export default function FounderNFTPage() {
  // Set page title
  useEffect(() => {
    document.title = "Frami Founder NFT | Exclusive Access & Benefits";
  }, []);

  return (
    <div className="min-h-screen">
      <HeroAndMintSection />
      <CoreBenefits />
      <PlatformDevelopmentRoadmap />
      <FAQ />
    </div>
  );
}
