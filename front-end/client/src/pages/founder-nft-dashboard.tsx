import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Coins,
  TrendingUp,
  Gift,
  Shield,
  Star,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Timer,
  Zap,
  Bell,
  Crown,
} from "lucide-react";
import founderNftVideo from "@/assets/videos/FounderNFT.mp4";

// Mock data for development - replace with real API calls
const mockNFTData = [
  {
    id: 1,
    tokenId: "#0042",
    image: "/api/placeholder/200/200",
    status: "staked",
    stakingDuration: "127 days",
    earnedRewards: "2.45 ETH",
    nextUnstakeDate: "2025-08-15",
  },
  {
    id: 2,
    tokenId: "#0156",
    image: "/api/placeholder/200/200",
    status: "unstaked",
    stakingDuration: "0 days",
    earnedRewards: "0 ETH",
    nextUnstakeDate: null,
  },
];

const mockStakingData = {
  totalStaked: 2,
  totalOwned: 2,
  currentAPY: 12.5,
  totalRewards: "2.45 ETH",
  minimumStakingPeriod: 7,
  unstakeCooldown: 14,
};

const mockEarningsData = {
  totalEarnings: "4.23 ETH",
  platformFees: "3.15 ETH",
  daoTokens: "850 FRAMI",
  monthlyEarnings: [
    { month: "Jan", amount: 0.45 },
    { month: "Feb", amount: 0.62 },
    { month: "Mar", amount: 0.78 },
    { month: "Apr", amount: 0.89 },
    { month: "May", amount: 1.23 },
    { month: "Jun", amount: 0.96 },
  ],
};

const mockClaims = [
  {
    id: 1,
    type: "Platform Fees",
    amount: "0.25 ETH",
    status: "available",
    estimatedGas: "0.003 ETH",
    date: "2025-05-24",
  },
  {
    id: 2,
    type: "Staking Rewards",
    amount: "0.15 ETH",
    status: "available",
    estimatedGas: "0.002 ETH",
    date: "2025-05-24",
  },
  {
    id: 3,
    type: "Platform Fees",
    amount: "0.18 ETH",
    status: "claimed",
    date: "2025-05-20",
  },
];

const mockExclusiveDeals = [
  {
    id: 1,
    title: "Premium Project Alpha",
    description: "Early access to revolutionary DeFi protocol",
    discount: "20% off",
    endDate: "2025-06-01",
    image: "/api/placeholder/100/100",
  },
  {
    id: 2,
    title: "NFT Collection Beta",
    description: "Exclusive mint access for FounderNFT holders",
    discount: "Free mint",
    endDate: "2025-05-30",
    image: "/api/placeholder/100/100",
  },
];

export default function FounderNFTDashboard() {
  const { isConnected, address } = useWallet();
  const [selectedTab, setSelectedTab] = useState("portfolio");
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNFTSelection = (nftId: number) => {
    setSelectedNFTs(prev => 
      prev.includes(nftId) 
        ? prev.filter(id => id !== nftId)
        : [...prev, nftId]
    );
  };

  const handleSelectAll = () => {
    setSelectedNFTs(mockNFTData.map(nft => nft.id));
  };

  const handleDeselectAll = () => {
    setSelectedNFTs([]);
  };

  const handleBulkStake = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Staking NFTs:', selectedNFTs);
      setSelectedNFTs([]);
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkUnstake = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Unstaking NFTs:', selectedNFTs);
      setSelectedNFTs([]);
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedStaked = () => {
    return selectedNFTs.filter(id => 
      mockNFTData.find(nft => nft.id === id)?.status === "staked"
    );
  };

  const getSelectedUnstaked = () => {
    return selectedNFTs.filter(id => 
      mockNFTData.find(nft => nft.id === id)?.status === "unstaked"
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111827] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto mb-4 text-[#8A63D2]" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the FounderNFT Dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111827] pt-20">
      <div className="container mx-auto px-4 max-w-[110rem] py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                FounderNFT Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your FounderNFTs, track earnings, and access exclusive
                benefits
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-[#8A63D2]/10 text-[#8A63D2] border-[#8A63D2]/20"
            >
              <Crown className="h-4 w-4 mr-1" />
              Founder Status
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total NFTs
                  </p>
                  <p className="text-2xl font-bold">
                    {mockStakingData.totalOwned}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-[#8A63D2]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Staked NFTs
                  </p>
                  <p className="text-2xl font-bold">
                    {mockStakingData.totalStaked}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold">
                    {mockEarningsData.totalEarnings}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Staking Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {mockStakingData.totalStaked}/{mockStakingData.totalOwned}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="earnings">Earnings & Claims</TabsTrigger>
            <TabsTrigger value="exclusive">Exclusive</TabsTrigger>
          </TabsList>

          {/* NFT Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6 p-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Your FounderNFT Collection
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Visual display of your owned FounderNFTs with current status
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {mockNFTData.map((nft) => (
                  <Card
                    key={nft.id}
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gradient-to-br from-[#8A63D2]/20 to-[#583c8e]/20 rounded-lg mb-3 overflow-hidden p-1">
                        <video
                          src={founderNftVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-contain rounded-md"
                          onLoadedData={(e) => {
                            e.currentTarget.playbackRate = 0.5;
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">
                            NFT {nft.tokenId}
                          </h4>
                          <Badge
                            variant={
                              nft.status === "staked" ? "default" : "secondary"
                            }
                            className={
                              nft.status === "staked"
                                ? "bg-green-500 text-xs"
                                : "text-xs"
                            }
                          >
                            {nft.status === "staked" ? "Staked" : "Unstaked"}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p>Duration: {nft.stakingDuration}</p>
                          <p>Rewards: {nft.earnedRewards}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Staking Management Tab */}
          <TabsContent value="staking" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Staking Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Staked NFTs</span>
                      <span className="font-semibold">
                        {mockStakingData.totalStaked}/
                        {mockStakingData.totalOwned}
                      </span>
                    </div>
                    <Progress
                      value={
                        (mockStakingData.totalStaked /
                          mockStakingData.totalOwned) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">
                        {mockStakingData.currentAPY}%
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Current APY
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold">
                        {mockStakingData.totalRewards}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Total Rewards
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Minimum staking period:{" "}
                      {mockStakingData.minimumStakingPeriod} days
                      <br />
                      Unstake cooldown: {mockStakingData.unstakeCooldown} days
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {/* Unstaked NFTs Section */}
                <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Available to Stake
                      </div>
                      <Badge variant="secondary">
                        {mockNFTData.filter(nft => nft.status === "unstaked").length} NFTs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockNFTData
                      .filter(nft => nft.status === "unstaked")
                      .map((nft) => (
                        <div key={nft.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox"
                              checked={selectedNFTs.includes(nft.id)}
                              onChange={() => handleNFTSelection(nft.id)}
                              className="w-4 h-4 text-[#8A63D2] border-gray-300 rounded focus:ring-[#8A63D2] focus:ring-2"
                            />
                            <div>
                              <p className="font-medium">FounderNFT {nft.tokenId}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Ready to earn rewards
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">Available</Badge>
                        </div>
                      ))}
                    
                    {getSelectedUnstaked().length > 0 && (
                      <div className="pt-3 border-t">
                        <Button 
                          onClick={handleBulkStake}
                          disabled={isProcessing}
                          className="bg-[#8A63D2] hover:bg-[#7651c0] w-full"
                        >
                          {isProcessing ? "Processing..." : `Stake ${getSelectedUnstaked().length} NFT${getSelectedUnstaked().length > 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Staked NFTs Section */}
                <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Currently Staked
                      </div>
                      <Badge className="bg-green-500">
                        {mockNFTData.filter(nft => nft.status === "staked").length} NFTs Earning
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockNFTData
                      .filter(nft => nft.status === "staked")
                      .map((nft) => (
                        <div key={nft.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox"
                              checked={selectedNFTs.includes(nft.id)}
                              onChange={() => handleNFTSelection(nft.id)}
                              className="w-4 h-4 text-[#8A63D2] border-gray-300 rounded focus:ring-[#8A63D2] focus:ring-2"
                            />
                            <div>
                              <p className="font-medium">FounderNFT {nft.tokenId}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Staked for {nft.stakingDuration} • Earned {nft.earnedRewards}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500">Earning</Badge>
                        </div>
                      ))}
                    
                    {getSelectedStaked().length > 0 && (
                      <div className="pt-3 border-t">
                        <Button 
                          onClick={handleBulkUnstake}
                          disabled={isProcessing}
                          variant="outline"
                          className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400"
                        >
                          {isProcessing ? "Processing..." : `Unstake ${getSelectedStaked().length} NFT${getSelectedStaked().length > 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selection Controls */}
                {selectedNFTs.length > 0 && (
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleDeselectAll}
                      variant="ghost"
                      size="sm"
                    >
                      Clear All Selections
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Earnings & Claims Tab */}
          <TabsContent value="earnings" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Earnings Chart
                  </CardTitle>
                  <CardDescription>
                    Historical earnings over the past 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockEarningsData.monthlyEarnings.map((month, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{month.month}</span>
                        <div className="flex items-center space-x-2 flex-1 ml-4">
                          <Progress
                            value={(month.amount / 1.5) * 100}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-16 text-right">
                            {month.amount} ETH
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Earnings Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Platform Fees</span>
                      <span className="font-semibold">
                        {mockEarningsData.platformFees}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">DAO Tokens</span>
                      <span className="font-semibold">
                        {mockEarningsData.daoTokens}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Earnings</span>
                        <span className="font-bold text-lg">
                          {mockEarningsData.totalEarnings}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Claims Section */}
            <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="h-5 w-5 mr-2" />
                  Available Claims
                </CardTitle>
                <CardDescription>
                  One-click claim functionality for available rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        claim.status === "available"
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {claim.status === "available" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">{claim.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {claim.date}
                          </p>
                          {claim.estimatedGas && (
                            <p className="text-xs text-gray-500">
                              Est. Gas: {claim.estimatedGas}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{claim.amount}</span>
                        {claim.status === "available" && (
                          <Button
                            size="sm"
                            className="bg-[#8A63D2] hover:bg-[#7651c0]"
                          >
                            Claim
                          </Button>
                        )}
                        {claim.status === "claimed" && (
                          <Badge variant="secondary">Claimed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Bulk Claiming Available
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                    Save on gas fees by claiming multiple rewards in a single
                    transaction
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Claim All Available (
                    {mockClaims.filter((c) => c.status === "available").length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exclusive Access Tab */}
          <TabsContent value="exclusive" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Exclusive Investment Opportunities
                  </CardTitle>
                  <CardDescription>
                    Early access to premium projects and deals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockExclusiveDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-[#8A63D2]/20 to-[#583c8e]/20 rounded-lg flex items-center justify-center">
                        <Star className="h-8 w-8 text-[#8A63D2]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {deal.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {deal.discount}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Ends {deal.endDate}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#8A63D2] hover:bg-[#7651c0]"
                      >
                        Access
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications & Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          Premium Features Enabled
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          Exclusive Deal Notifications
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">
                          Founder Community Access
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
