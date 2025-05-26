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
    tokenId: "#0078",
    image: "/api/placeholder/200/200",
    status: "staked",
    stakingDuration: "89 days",
    earnedRewards: "1.67 ETH",
    nextUnstakeDate: "2025-09-02",
  },
  {
    id: 3,
    tokenId: "#0156",
    image: "/api/placeholder/200/200",
    status: "unstaked",
    stakingDuration: "0 days",
    earnedRewards: "0 ETH",
    nextUnstakeDate: null,
  },
  {
    id: 4,
    tokenId: "#0234",
    image: "/api/placeholder/200/200",
    status: "unstaked",
    stakingDuration: "0 days",
    earnedRewards: "0 ETH",
    nextUnstakeDate: null,
  },
];

const mockStakingData = {
  totalStaked: 2,
  totalOwned: 4,
  currentAPY: 12.5,
  totalRewards: "4.12 ETH",
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
  const [selectedTab, setSelectedTab] = useState("staking");
  const [selectedNFTs, setSelectedNFTs] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNFTSelection = (nftId: number) => {
    setSelectedNFTs((prev) =>
      prev.includes(nftId)
        ? prev.filter((id) => id !== nftId)
        : [...prev, nftId],
    );
  };

  const handleSelectAllUnstaked = () => {
    const unstakedNFTs = mockNFTData.filter((nft) => nft.status === "unstaked");
    const unstakedIds = unstakedNFTs.map((nft) => nft.id);
    setSelectedNFTs((prev) => {
      const combined = [...prev, ...unstakedIds];
      return combined.filter((id, index) => combined.indexOf(id) === index);
    });
  };

  const handleSelectAllStaked = () => {
    const stakedNFTs = mockNFTData.filter((nft) => nft.status === "staked");
    const stakedIds = stakedNFTs.map((nft) => nft.id);
    setSelectedNFTs((prev) => {
      const combined = [...prev, ...stakedIds];
      return combined.filter((id, index) => combined.indexOf(id) === index);
    });
  };

  const handleDeselectAllUnstaked = () => {
    const unstakedIds = mockNFTData
      .filter((nft) => nft.status === "unstaked")
      .map((nft) => nft.id);
    setSelectedNFTs((prev) => prev.filter((id) => !unstakedIds.includes(id)));
  };

  const handleDeselectAllStaked = () => {
    const stakedIds = mockNFTData
      .filter((nft) => nft.status === "staked")
      .map((nft) => nft.id);
    setSelectedNFTs((prev) => prev.filter((id) => !stakedIds.includes(id)));
  };

  const handleDeselectAll = () => {
    setSelectedNFTs([]);
  };

  const handleBulkStake = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Staking NFTs:", selectedNFTs);
      setSelectedNFTs([]);
    } catch (error) {
      console.error("Staking failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkUnstake = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Unstaking NFTs:", selectedNFTs);
      setSelectedNFTs([]);
    } catch (error) {
      console.error("Unstaking failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedStaked = () => {
    return selectedNFTs.filter(
      (id) => mockNFTData.find((nft) => nft.id === id)?.status === "staked",
    );
  };

  const getSelectedUnstaked = () => {
    return selectedNFTs.filter(
      (id) => mockNFTData.find((nft) => nft.id === id)?.status === "unstaked",
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
          <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
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

          <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
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

          <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
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

          <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Platform Staked
                  </p>
                  <p className="text-2xl font-bold">8,547</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    of 10,000 total NFTs
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="bg-white dark:bg-[#1a1e31] rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700 h-12">
            <TabsTrigger value="staking" className="text-base font-medium">
              Staking
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-base font-medium">
              Earnings & Claims
            </TabsTrigger>
            <TabsTrigger value="exclusive" className="text-base font-medium">
              Exclusive
            </TabsTrigger>
          </TabsList>

          {/* Staking Management Tab */}
          <TabsContent value="staking" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unstaked NFTs Section */}
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Available to Stake
                    </div>
                    <Badge variant="secondary">
                      {
                        mockNFTData.filter((nft) => nft.status === "unstaked")
                          .length
                      }{" "}
                      NFTs
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllUnstaked}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllUnstaked}
                      className="text-xs"
                    >
                      Deselect All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockNFTData
                    .filter((nft) => nft.status === "unstaked")
                    .map((nft) => (
                      <div
                        key={nft.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedNFTs.includes(nft.id)}
                            onChange={() => handleNFTSelection(nft.id)}
                            className="w-4 h-4 text-[#8A63D2] border-gray-300 rounded focus:ring-[#8A63D2] focus:ring-2"
                          />
                          <div>
                            <p className="font-medium">
                              FounderNFT {nft.tokenId}
                            </p>
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
                        {isProcessing
                          ? "Processing..."
                          : `Stake ${getSelectedUnstaked().length} NFT${getSelectedUnstaked().length > 1 ? "s" : ""}`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Staked NFTs Section */}
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Currently Staked
                    </div>
                    <Badge className="bg-green-500">
                      {
                        mockNFTData.filter((nft) => nft.status === "staked")
                          .length
                      }{" "}
                      NFTs Earning
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStaked}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllStaked}
                      className="text-xs"
                    >
                      Deselect All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockNFTData
                    .filter((nft) => nft.status === "staked")
                    .map((nft) => (
                      <div
                        key={nft.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedNFTs.includes(nft.id)}
                            onChange={() => handleNFTSelection(nft.id)}
                            className="w-4 h-4 text-[#8A63D2] border-gray-300 rounded focus:ring-[#8A63D2] focus:ring-2"
                          />
                          <div>
                            <p className="font-medium">
                              FounderNFT {nft.tokenId}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Staked for {nft.stakingDuration} • Earned{" "}
                              {nft.earnedRewards}
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
                        {isProcessing
                          ? "Processing..."
                          : `Unstake ${getSelectedStaked().length} NFT${getSelectedStaked().length > 1 ? "s" : ""}`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Selection Controls */}
            {selectedNFTs.length > 0 && (
              <div className="flex justify-center">
                <Button onClick={handleDeselectAll} variant="ghost" size="sm">
                  Clear All Selections
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Earnings & Claims Tab */}
          <TabsContent value="earnings" className="space-y-6 p-6">
            <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Earnings & Claims
                </CardTitle>
                <CardDescription>
                  View your accumulated earnings and claim available rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Earnings Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Current Earnings</h3>
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
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-lg">
                          Total Available to Claim
                        </span>
                        <span className="font-bold text-xl text-[#8A63D2]">
                          {mockEarningsData.totalEarnings}
                        </span>
                      </div>
                      <Button
                        className=" bg-[#8A63D2] hover:bg-[#7651c0] text-white"
                        onClick={() => {
                          // Handle claim functionality
                          alert("Claiming all earnings...");
                        }}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Claim All Earnings
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Claims History */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Claim History</h3>
                  <div className="space-y-3">
                    {mockClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-4 border rounded-lg border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{claim.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {claim.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold">{claim.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exclusive Access Tab */}
          <TabsContent value="exclusive" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
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

              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
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
