import { useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { useFounderNFTDashboard } from "@/hooks/useFounderNFTDashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  TrendingUp,
  Gift,
  Shield,
  Star,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Bell,
  Crown,
  Loader2,
} from "lucide-react";

export default function FounderNFTDashboard() {
  const { isConnected, connect } = useWallet();
  const {
    nftData,
    stakingData,
    earningsData,
    isLoading,
    error,
    transactionState,
    stakeNFTs,
    unstakeNFTs,
    claimAllRewards,
    refreshData,
    resetTransactionState,
    isContractReady,
  } = useFounderNFTDashboard();

  const [selectedTab, setSelectedTab] = useState("staking");
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  // Get available and staked NFTs
  const availableNFTs = nftData.filter(nft => nft.status === "unstaked");
  const stakedNFTs = nftData.filter(nft => nft.status === "staked");
  const unstakeableNFTs = stakedNFTs.filter(nft => nft.canUnstake);

  // Handle connect wallet
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Handle staking
  const handleStakeConfirm = async () => {
    const amount = parseInt(stakeAmount);
    if (amount > 0 && amount <= availableNFTs.length) {
      try {
        const tokenIds = availableNFTs.slice(0, amount).map(nft => nft.id);
        await stakeNFTs(tokenIds);
        setStakeModalOpen(false);
        setStakeAmount("");
      } catch (error) {
        console.error("Staking failed:", error);
      }
    }
  };

  // Handle unstaking
  const handleUnstakeConfirm = async () => {
    const amount = parseInt(unstakeAmount);
    if (amount > 0 && amount <= unstakeableNFTs.length) {
      try {
        const tokenIds = unstakeableNFTs.slice(0, amount).map(nft => nft.id);
        await unstakeNFTs(tokenIds);
        setUnstakeModalOpen(false);
        setUnstakeAmount("");
      } catch (error) {
        console.error("Unstaking failed:", error);
      }
    }
  };

  // Handle claiming rewards
  const handleClaimAllRewards = async () => {
    try {
      await claimAllRewards();
    } catch (error) {
      console.error("Claiming failed:", error);
    }
  };

  // Handle modal opens
  const handleStakeModalOpen = () => {
    setStakeAmount(availableNFTs.length.toString());
    setStakeModalOpen(true);
  };

  const handleUnstakeModalOpen = () => {
    setUnstakeAmount(unstakeableNFTs.length.toString());
    setUnstakeModalOpen(true);
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
          <CardContent className="text-center">
            <Button onClick={handleConnect} className="bg-[#8A63D2] hover:bg-[#7651c0]">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111827] pt-20">
        <div className="container mx-auto px-4 max-w-[110rem] py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-[#1a1e31]">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111827] pt-20">
        <div className="container mx-auto px-4 max-w-[110rem] py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={refreshData}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
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
                Manage your FounderNFTs, track earnings, and access exclusive benefits
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="secondary"
                className="bg-[#8A63D2]/10 text-[#8A63D2] border-[#8A63D2]/20"
              >
                <Crown className="h-4 w-4 mr-1" />
                Founder Status
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
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
                    {stakingData.totalOwned}
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
                    {stakingData.totalStaked}
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
                    {earningsData.totalEarnings}
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
                    Available to Stake
                  </p>
                  <p className="text-2xl font-bold">{availableNFTs.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    of {stakingData.totalOwned} total NFTs
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Status Alert */}
        {transactionState.status !== "idle" && (
          <Alert className={`mb-6 ${transactionState.status === "pending"
              ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
              : transactionState.status === "success"
                ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                : "border-red-300 bg-red-50 dark:bg-red-900/20"
            }`}>
            <div className="flex items-center">
              {transactionState.status === "pending" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {transactionState.status === "success" && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
              {transactionState.status === "error" && <AlertCircle className="h-4 w-4 mr-2 text-red-600" />}
              <AlertDescription>
                {transactionState.status === "pending" && "Transaction in progress..."}
                {transactionState.status === "success" && "Transaction completed successfully!"}
                {transactionState.status === "error" && (transactionState.error || "Transaction failed")}
              </AlertDescription>
              {transactionState.status !== "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTransactionState}
                  className="ml-auto"
                >
                  ×
                </Button>
              )}
            </div>
          </Alert>
        )}

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
              {/* Unstaked NFTs Summary */}
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Available to Stake
                  </CardTitle>
                  <CardDescription>
                    NFTs ready to start earning rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                      <p className="text-3xl font-bold text-[#8A63D2] mb-2">
                        {availableNFTs.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        NFTs Available
                      </p>
                    </div>
                  </div>

                  {/* Show list of available NFTs if any */}
                  {availableNFTs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Available NFTs:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableNFTs.slice(0, 5).map(nft => (
                          <Badge key={nft.id} variant="outline" className="text-xs">
                            {nft.tokenId}
                          </Badge>
                        ))}
                        {availableNFTs.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{availableNFTs.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      onClick={handleStakeModalOpen}
                      disabled={availableNFTs.length === 0 || transactionState.isLoading || !isContractReady}
                      className="bg-[#8A63D2] hover:bg-[#7651c0] w-1/2"
                    >
                      {transactionState.isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Stake NFTs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Staked NFTs Summary */}
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Currently Staked
                  </CardTitle>
                  <CardDescription>
                    NFTs actively earning rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-1/2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                      <p className="text-3xl font-bold text-green-600 mb-2">
                        {stakedNFTs.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        NFTs Earning
                      </p>
                    </div>
                  </div>

                  {/* Show list of staked NFTs if any */}
                  {stakedNFTs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Staked NFTs:</p>
                      <div className="flex flex-wrap gap-2">
                        {stakedNFTs.slice(0, 5).map(nft => (
                          <Badge
                            key={nft.id}
                            variant="outline"
                            className={`text-xs ${nft.canUnstake ? 'border-green-300 text-green-700' : 'border-orange-300 text-orange-700'}`}
                          >
                            {nft.tokenId} {nft.canUnstake ? '✓' : '⏳'}
                          </Badge>
                        ))}
                        {stakedNFTs.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{stakedNFTs.length - 5} more
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ✓ = Can unstake, ⏳ = Minimum period not reached
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Rewards Earned:</span>
                      <span className="font-medium">{stakingData.totalRewards}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Can Unstake:</span>
                      <span className="font-medium">{unstakeableNFTs.length} NFTs</span>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        onClick={handleUnstakeModalOpen}
                        disabled={unstakeableNFTs.length === 0 || transactionState.isLoading || !isContractReady}
                        variant="outline"
                        className="w-1/2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400"
                      >
                        {transactionState.isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 mr-2" />
                        )}
                        Unstake NFTs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Minimum Staking Period Info */}
            {stakingData.minimumStakingPeriod > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> NFTs must be staked for at least {stakingData.minimumStakingPeriod} days before they can be unstaked.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Earnings & Claims Tab */}
          <TabsContent value="earnings" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Details Card */}
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Earnings Details
                  </CardTitle>
                  <CardDescription>
                    View your accumulated earnings breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly Rewards</span>
                      <span className="font-semibold">{earningsData.totalEarnings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Staked NFTs</span>
                      <span className="font-semibold">{stakingData.totalStaked}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">Total Earned</span>
                        <span className="font-bold text-xl text-[#8A63D2]">
                          {earningsData.totalEarnings}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Claiming Card */}
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="h-5 w-5 mr-2" />
                    Claim Earnings
                  </CardTitle>
                  <CardDescription>
                    Claim your available earnings rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-2/5 bg-gradient-to-br from-[#8A63D2]/10 to-[#583c8e]/10 border border-[#8A63D2]/20 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Available to Claim
                        </p>
                        <p className="text-3xl font-bold text-[#8A63D2]">
                          {earningsData.claimableAmount}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        className="w-2/5 bg-[#8A63D2] hover:bg-[#7651c0] text-white"
                        onClick={handleClaimAllRewards}
                        disabled={
                          parseFloat(earningsData.claimableAmount.replace(' ETH', '')) === 0 ||
                          transactionState.isLoading ||
                          !isContractReady ||
                          stakedNFTs.length === 0
                        }
                      >
                        {transactionState.isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Gift className="h-4 w-4 mr-2" />
                        )}
                        Claim All Earnings
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {stakedNFTs.length === 0
                        ? "No staked NFTs to claim rewards for"
                        : "Claiming will transfer earnings to your wallet"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* NFT Rewards Breakdown */}
            {stakedNFTs.length > 0 && (
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Individual NFT Rewards
                  </CardTitle>
                  <CardDescription>
                    Breakdown of rewards for each staked NFT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stakedNFTs.map((nft) => (
                      <div
                        key={nft.id}
                        className="flex items-center justify-between p-4 border rounded-lg border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{nft.tokenId}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Staked for {nft.stakingDuration}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{nft.earnedRewards}</span>
                          {!nft.canUnstake && nft.nextUnstakeDate && (
                            <p className="text-xs text-orange-500">
                              Can unstake: {nft.nextUnstakeDate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exclusive Access Tab */}
          <TabsContent value="exclusive" className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Founder Benefits
                  </CardTitle>
                  <CardDescription>
                    Your exclusive access and privileges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Platform Fee Distribution</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Early Access to Projects</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Enabled
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Weekly Reward System</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {stakingData.totalStaked > 0 ? 'Earning' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Your Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-[#8A63D2]/10 rounded-lg border border-[#8A63D2]/20">
                      <Crown className="h-8 w-8 mx-auto mb-2 text-[#8A63D2]" />
                      <p className="font-semibold text-[#8A63D2]">Founder Status</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        You own {stakingData.totalOwned} FounderNFT{stakingData.totalOwned !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{stakingData.totalStaked}</p>
                        <p className="text-xs text-gray-500">Staked</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{availableNFTs.length}</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Stake Modal */}
        <Dialog open={stakeModalOpen} onOpenChange={setStakeModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-[#8A63D2]" />
                Stake FounderNFTs
              </DialogTitle>
              <DialogDescription>
                Choose how many NFTs you want to stake to start earning rewards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Number of NFTs to Stake</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  min="1"
                  max={availableNFTs.length}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500">
                  Available: {availableNFTs.length} NFTs
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStakeModalOpen(false)}
                disabled={transactionState.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStakeConfirm}
                disabled={transactionState.isLoading || !stakeAmount || parseInt(stakeAmount) < 1 || parseInt(stakeAmount) > availableNFTs.length}
                className="bg-[#8A63D2] hover:bg-[#7651c0]"
              >
                {transactionState.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Staking...
                  </>
                ) : (
                  `Stake ${stakeAmount || 0} NFT${parseInt(stakeAmount) !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unstake Modal */}
        <Dialog open={unstakeModalOpen} onOpenChange={setUnstakeModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Unstake FounderNFTs
              </DialogTitle>
              <DialogDescription>
                Choose how many NFTs you want to unstake. Note that you'll stop earning rewards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Number of NFTs to Unstake</Label>
                <Input
                  id="unstake-amount"
                  type="number"
                  min="1"
                  max={unstakeableNFTs.length}
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500">
                  Can unstake: {unstakeableNFTs.length} NFTs (out of {stakedNFTs.length} staked)
                </p>
                {stakedNFTs.length > unstakeableNFTs.length && (
                  <p className="text-sm text-orange-600">
                    {stakedNFTs.length - unstakeableNFTs.length} NFT{stakedNFTs.length - unstakeableNFTs.length !== 1 ? 's' : ''} haven't reached minimum staking period
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnstakeModalOpen(false)}
                disabled={transactionState.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnstakeConfirm}
                disabled={transactionState.isLoading || !unstakeAmount || parseInt(unstakeAmount) < 1 || parseInt(unstakeAmount) > unstakeableNFTs.length}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                {transactionState.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Unstaking...
                  </>
                ) : (
                  `Unstake ${unstakeAmount || 0} NFT${parseInt(unstakeAmount) !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}