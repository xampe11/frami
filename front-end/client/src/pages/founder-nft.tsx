import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, PieChart, Users, VoteIcon, Clock, Info, AlertCircle } from "lucide-react";
import gsap from "gsap";
import founderNftVideo from "../assets/videos/FounderNFT.mp4";

// Hero Section component
const HeroSection = () => {
  const nftImageRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    if (nftImageRef.current && textContentRef.current) {
      tl.from(nftImageRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      })
      .from(textContentRef.current.children, {
        y: 30,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.5");
    }
  }, []);

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-[#111827] dark:bg-[#111827]">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* NFT Showcase */}
        <div 
          ref={nftImageRef}
          className="flex justify-center"
        >
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-1 max-w-md mx-auto w-full">
            <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-blue-900/40 shadow-xl relative flex items-center justify-center p-4">
              <video
                src={founderNftVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
                style={{ maxHeight: "100%" }}
              />
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                Exclusive Collection
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div ref={textContentRef} className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Founder NFT
          </h1>
          <p className="text-xl md:text-2xl text-gray-300">
            Your exclusive access pass to platform governance, fee distribution, and early project access.
          </p>
          
          {/* NFT Stats */}
          <div ref={counterRef} className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-[#1a1e31] p-4 rounded-xl border border-gray-700">
              <div className="text-sm text-gray-400">Supply</div>
              <div className="text-2xl font-bold text-white">1,000 / 1,000</div>
              <Progress value={100} className="h-1.5 mt-2 bg-indigo-900" />
            </div>
            <div className="bg-[#1a1e31] p-4 rounded-xl border border-gray-700">
              <div className="text-sm text-gray-400">Price</div>
              <div className="text-2xl font-bold text-white">0.1 ETH</div>
              <div className="text-sm text-gray-400 mt-2">≈ $250 USD</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Mint Interface component
const MintInterface = () => {
  const [quantity, setQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<null | 'pending' | 'success' | 'error'>(null);
  const { isConnected, connect } = useWallet();
  const { toast } = useToast();

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
    setTransactionStatus('pending');
    
    // Simulate transaction
    setTimeout(() => {
      setIsMinting(false);
      setTransactionStatus('success');
      toast({
        title: "NFT Minted Successfully",
        description: `You've successfully minted ${quantity} Founder NFT${quantity > 1 ? 's' : ''}!`,
      });
    }, 2000);
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center">Mint Your Founder NFT</h2>
        
        <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-lg overflow-hidden">
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-900/40 to-blue-900/40">
              <video
                src={founderNftVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <CardHeader>
            <CardTitle>Founder NFT Minting</CardTitle>
            <CardDescription>Select quantity and review gas fees before minting</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center border rounded-md overflow-hidden">
                <button 
                  onClick={decrementQuantity} 
                  className="px-3 py-2 bg-muted hover:bg-muted/80 transition-colors border-r"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <div className="flex-1 text-center py-2">{quantity}</div>
                <button 
                  onClick={incrementQuantity} 
                  className="px-3 py-2 bg-muted hover:bg-muted/80 transition-colors border-l"
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Price Information */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Price per NFT</span>
                <span className="font-medium">0.1 ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity</span>
                <span className="font-medium">x{quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Gas Fee</span>
                <span className="font-medium">~0.005 ETH</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{(quantity * 0.1 + 0.005).toFixed(3)} ETH</span>
                </div>
              </div>
            </div>
            
            {/* Transaction Status */}
            {transactionStatus && (
              <div className={`p-3 rounded-md ${
                transactionStatus === 'pending' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                transactionStatus === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              }`}>
                <div className="flex items-center">
                  {transactionStatus === 'pending' && <Clock className="h-4 w-4 mr-2" />}
                  {transactionStatus === 'success' && <div className="h-4 w-4 mr-2">✓</div>}
                  {transactionStatus === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
                  <span>
                    {transactionStatus === 'pending' && 'Transaction in progress...'}
                    {transactionStatus === 'success' && 'Transaction successful!'}
                    {transactionStatus === 'error' && 'Transaction failed. Please try again.'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={handleMint} 
              className="w-full" 
              disabled={isMinting}
            >
              {!isConnected ? "Connect Wallet to Mint" : 
               isMinting ? "Processing..." : 
               `Mint ${quantity} NFT${quantity > 1 ? 's' : ''}`}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
};

// Core Benefits Section
const CoreBenefits = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (sectionRef.current) {
      const items = sectionRef.current.querySelectorAll('.benefit-card');
      
      gsap.from(items, {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        }
      });
    }
  }, []);
  
  const benefits = [
    {
      title: "Fee Distribution",
      description: "Receive a share of platform fees proportional to your NFT holdings.",
      icon: <PieChart className="h-10 w-10 text-primary" />,
      animation: "diagram showing fee distribution flow with percentages and arrows"
    },
    {
      title: "Early Access",
      description: "Get priority access to new projects before they're available to the general public.",
      icon: <Clock className="h-10 w-10 text-primary" />,
      animation: "timeline visualization showing early access window"
    },
    {
      title: "Governance Rights",
      description: "Vote on platform proposals and participate in key decision-making processes.",
      icon: <VoteIcon className="h-10 w-10 text-primary" />,
      animation: "voting mechanism with tokens being allocated to different proposals"
    }
  ];
  
  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Core Benefits</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Each Founder NFT unlocks exclusive benefits that increase in value as the platform grows.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="benefit-card flex flex-col p-6 bg-card rounded-xl shadow-md border border-border hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground mb-4">{benefit.description}</p>
              
              {/* Animated graphic placeholder */}
              <div className="mt-auto h-32 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground italic p-2 text-center">
                {benefit.animation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Platform Integration section
const PlatformIntegration = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Platform Integration</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Founder NFTs are deeply integrated into the core functionality of our platform.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Infographic */}
          <div className="rounded-xl bg-muted p-6 aspect-square max-w-lg mx-auto w-full flex items-center justify-center">
            <div className="relative w-full h-full">
              <div className="absolute inset-1/4 rounded-full border-4 border-primary/30 flex items-center justify-center">
                <div className="absolute inset-1/4 rounded-full border-2 border-primary/50 bg-background/80 flex items-center justify-center p-2">
                  <video 
                    src={founderNftVideo} 
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Connection lines */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-16 border-l-2 border-dashed border-primary/30"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full h-16 border-l-2 border-dashed border-primary/30"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-16 border-t-2 border-dashed border-primary/30"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-16 border-t-2 border-dashed border-primary/30"></div>
              </div>
              
              {/* Connected elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg p-3 shadow-md border border-border">
                <div className="text-sm font-medium">Governance</div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-background rounded-lg p-3 shadow-md border border-border">
                <div className="text-sm font-medium">Fee Distribution</div>
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-background rounded-lg p-3 shadow-md border border-border">
                <div className="text-sm font-medium">Early Access</div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-background rounded-lg p-3 shadow-md border border-border">
                <div className="text-sm font-medium">Staking</div>
              </div>
            </div>
          </div>
          
          {/* Roadmap */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold">Platform Development Roadmap</h3>
            
            <div className="space-y-4">
              {/* Q2 2025 */}
              <div className="relative pl-8 pb-8 border-l-2 border-primary/50">
                <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2"></div>
                <h4 className="text-xl font-bold">Q2 2025</h4>
                <p className="text-muted-foreground">Founder NFT launch with initial governance capabilities</p>
              </div>
              
              {/* Q3 2025 */}
              <div className="relative pl-8 pb-8 border-l-2 border-primary/50">
                <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2"></div>
                <h4 className="text-xl font-bold">Q3 2025</h4>
                <p className="text-muted-foreground">Fee distribution system activation and early access privileges</p>
              </div>
              
              {/* Q4 2025 */}
              <div className="relative pl-8 pb-8 border-l-2 border-primary/50">
                <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2"></div>
                <h4 className="text-xl font-bold">Q4 2025</h4>
                <p className="text-muted-foreground">Full staking functionality and expanded governance features</p>
              </div>
              
              {/* Q1 2026 */}
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -translate-x-1/2"></div>
                <h4 className="text-xl font-bold">Q1 2026</h4>
                <p className="text-muted-foreground">Cross-platform integration and enhanced utility features</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground pt-4">
              This roadmap is subject to change based on market conditions and community feedback.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// FAQ section
const FAQ = () => {
  return (
    <section className="py-20 bg-gradient-to-t from-background to-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Frequently Asked Questions</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Get answers to the most common questions about our Founder NFTs.
        </p>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I mint a Founder NFT?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">To mint a Founder NFT, follow these steps:</p>
                <ol className="list-decimal pl-5 space-y-1 mb-2">
                  <li>Connect your Ethereum wallet (MetaMask, WalletConnect, etc.)</li>
                  <li>Select the desired quantity (1-10 NFTs per transaction)</li>
                  <li>Click the "Mint" button and confirm the transaction in your wallet</li>
                  <li>Wait for the transaction to be confirmed on the blockchain</li>
                </ol>
                <p>Once minted, your NFTs will appear in your connected wallet and can be viewed on popular NFT marketplaces.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How is the fee distribution calculated?</AccordionTrigger>
              <AccordionContent>
                <p>Fee distribution is calculated proportionally based on the number of Founder NFTs you hold. 30% of all platform fees are allocated to the Founder NFT holders pool. Distributions occur on a monthly basis and can be claimed through the platform dashboard.</p>
                <p className="mt-2">For example, if you own 10 out of 1000 Founder NFTs (1%), you'll receive 1% of the 30% fee allocation, which equals 0.3% of the total platform fees.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>What governance rights do Founder NFT holders have?</AccordionTrigger>
              <AccordionContent>
                <p>Founder NFT holders have significant governance rights, including:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Voting on platform upgrade proposals</li>
                  <li>Participating in feature prioritization</li>
                  <li>Providing input on fee structures</li>
                  <li>Voting on funding allocations for ecosystem development</li>
                </ul>
                <p className="mt-2">Each Founder NFT represents one vote in the governance system. Voting takes place through a secure on-chain mechanism.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Can I sell my Founder NFT on secondary markets?</AccordionTrigger>
              <AccordionContent>
                <p>Yes, Founder NFTs are fully transferable ERC-721 tokens that can be sold on secondary markets like OpenSea, Rarible, and LooksRare. All associated benefits transfer with the NFT to the new owner.</p>
                <p className="mt-2">There is a 5% royalty fee on secondary sales that goes back to the platform treasury, helping to maintain the value of all Founder NFTs by funding ongoing development.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>How are Founder NFT benefits activated?</AccordionTrigger>
              <AccordionContent>
                <p>Founder NFT benefits are automatically activated when you hold the NFT in a connected wallet. There's no need for manual activation.</p>
                <p className="mt-2">For fee distribution and governance participation, you'll need to connect your wallet to the platform dashboard. Early access benefits are applied automatically when new projects launch on the platform.</p>
                <p className="mt-2">In some cases, you may need to stake your NFT to access specific benefits, which will be clearly communicated when those features become available.</p>
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
      <HeroSection />
      <MintInterface />
      <CoreBenefits />
      <PlatformIntegration />
      <FAQ />
    </div>
  );
}