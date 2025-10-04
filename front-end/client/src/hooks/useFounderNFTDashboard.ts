// hooks/useFounderNFTDashboard.ts - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useQuery } from "@apollo/client";
import { useWallet } from "@/contexts/wallet-context";
import founderNFTAbi from "../contracts/abis/FounderNFT.json";
import { FOUNDER_NFT_ADDRESS, CHAIN_ID } from "../contracts/addresses";
import { useToast } from "@/hooks/use-toast";
import {
  GET_USER_DASHBOARD,
  GET_PLATFORM_STATS,
  GET_PLATFORM_CONFIG,
} from "@/graphql/graphql-queries";

const FOUNDER_NFT_ABI = founderNFTAbi;

interface NFTData {
  id: number;
  tokenId: string;
  status: "staked" | "unstaked";
  stakingDuration: string;
  earnedRewards: string;
  realtimeEarnings: string;
  nextUnstakeDate: string | null;
  canUnstake: boolean;
  stakingSince?: number;
}

interface StakingData {
  totalStaked: number;
  totalOwned: number;
  currentAPY: number;
  totalRewards: string;
  minimumStakingPeriod: number;
  currentRewardRate: string;
  estimatedAPR: number;
  totalStakedGlobally: number;
}

interface EarningsData {
  totalEarnings: string;
  platformFees: string;
  daoTokens: string;
  claimableAmount: string;
  realtimeClaimable: string;
}

interface DashboardState {
  nftData: NFTData[];
  stakingData: StakingData;
  earningsData: EarningsData;
  isLoading: boolean;
  error: string | null;
}

interface TransactionState {
  isLoading: boolean;
  status: "idle" | "pending" | "success" | "error";
  transactionHash: string | null;
  error: string | null;
}

export const useFounderNFTDashboard = () => {
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const fetchInProgress = useRef(false);

  const [dashboardData, setDashboardData] = useState<DashboardState>({
    nftData: [],
    stakingData: {
      totalStaked: 0,
      totalOwned: 0,
      currentAPY: 0,
      totalRewards: "0",
      minimumStakingPeriod: 0,
      currentRewardRate: "0",
      estimatedAPR: 0,
      totalStakedGlobally: 0,
    },
    earningsData: {
      totalEarnings: "0",
      platformFees: "0",
      daoTokens: "0",
      claimableAmount: "0",
      realtimeClaimable: "0",
    },
    isLoading: true,
    error: null,
  });

  const [transactionState, setTransactionState] = useState<TransactionState>({
    isLoading: false,
    status: "idle",
    transactionHash: null,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [readOnlyContract, setReadOnlyContract] =
    useState<ethers.Contract | null>(null);

  // GraphQL queries with proper error handling
  const {
    data: userGraphQLData,
    loading: userGraphQLLoading,
    error: userGraphQLError,
    refetch: refetchUserData,
  } = useQuery(GET_USER_DASHBOARD, {
    variables: { userAddress: address?.toLowerCase() || "" },
    skip: !address,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  const {
    data: platformGraphQLData,
    loading: platformGraphQLLoading,
    error: platformGraphQLError,
    refetch: refetchPlatformData,
  } = useQuery(GET_PLATFORM_STATS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  const {
    data: platformConfigData,
    loading: platformConfigLoading,
    error: platformConfigError,
    refetch: refetchPlatformConfig,
  } = useQuery(GET_PLATFORM_CONFIG, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  // Setup providers and contracts
  useEffect(() => {
    const setupContracts = async () => {
      if (typeof window.ethereum !== "undefined" && isConnected) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(browserProvider);

          const contractInstance = new ethers.Contract(
            FOUNDER_NFT_ADDRESS,
            FOUNDER_NFT_ABI,
            browserProvider
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("Failed to setup connected contracts:", error);
        }
      }

      // Always setup read-only contract
      try {
        const readOnlyProvider = new ethers.JsonRpcProvider(
          `https://eth-mainnet.g.alchemy.com/v2/${
            import.meta.env.VITE_ALCHEMY_API_KEY
          }`
        );
        const readOnlyContractInstance = new ethers.Contract(
          FOUNDER_NFT_ADDRESS,
          FOUNDER_NFT_ABI,
          readOnlyProvider
        );
        setReadOnlyContract(readOnlyContractInstance);
      } catch (error) {
        console.error("Failed to setup read-only contract:", error);
      }
    };

    setupContracts();
  }, [isConnected]);

  // Helper functions
  const calculateStakingDuration = useCallback(
    (stakingSince: number): string => {
      if (!stakingSince) return "0 days";
      const now = Math.floor(Date.now() / 1000);
      const duration = now - stakingSince;
      const days = Math.floor(duration / (24 * 60 * 60));
      const hours = Math.floor((duration % (24 * 60 * 60)) / (60 * 60));
      return days > 0 ? `${days} days` : `${hours} hours`;
    },
    []
  );

  const formatDate = useCallback((timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString().split("T")[0];
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (fetchInProgress.current || !address) return;

    fetchInProgress.current = true;

    try {
      setDashboardData((prev) => ({ ...prev, isLoading: true, error: null }));

      console.log("🔍 Fetch Dashboard Data Called");
      console.log("  User GraphQL Data:", userGraphQLData);
      console.log("  Platform Config Data:", platformConfigData);
      console.log("  Platform GraphQL Data:", platformGraphQLData);

      // ✅ CRITICAL FIX: Check if all required data is available
      if (!userGraphQLData?.user) {
        console.log("⏳ Waiting for user data to load...");
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error: "User data loading...",
        }));
        fetchInProgress.current = false;
        return;
      }

      // Check if user has NFTs (empty array is valid)
      const userNFTs = userGraphQLData.user.nfts || [];
      console.log("  User NFTs count:", userNFTs.length);

      // ✅ CRITICAL FIX: Check if platform config is loaded
      if (!platformConfigData?.platformConfig) {
        console.log("⏳ Waiting for platform config to load...");
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error: "Platform configuration loading...",
        }));
        fetchInProgress.current = false;
        return;
      }

      // Handle case where user has no NFTs (still valid - show empty state)
      if (userNFTs.length === 0) {
        console.log("ℹ️ User has no NFTs");
        setDashboardData((prev) => ({
          ...prev,
          nftData: [],
          stakingData: {
            ...prev.stakingData,
            totalOwned: 0,
            totalStaked: 0,
            totalRewards: "0",
          },
          earningsData: {
            ...prev.earningsData,
            totalEarnings: "0",
            claimableAmount: "0",
            realtimeClaimable: "0",
          },
          isLoading: false,
          error: null,
        }));
        fetchInProgress.current = false;
        return;
      }

      // ✅ Get platform data from subgraph
      const currentRewardRate = platformGraphQLData?.platformStats
        ?.currentRewardRate
        ? parseFloat(platformGraphQLData.platformStats.currentRewardRate)
        : 0;

      const totalStakedGlobally =
        platformGraphQLData?.platformStats?.totalNFTsStaked || 0;
      const currentTimeSeconds = Math.floor(Date.now() / 1000);

      console.log("📊 Platform Reward System:");
      console.log(
        "  Current Reward Rate:",
        currentRewardRate,
        "ETH/sec (total for all stakers)"
      );
      console.log("  Total NFTs Staked:", totalStakedGlobally);
      console.log(
        "  Reward per NFT per Second:",
        totalStakedGlobally > 0
          ? (currentRewardRate / totalStakedGlobally).toFixed(10)
          : "N/A",
        "ETH"
      );

      // ✅ Safe extraction of minimum staking period
      const minimumStakingPeriodSeconds = Number(
        platformConfigData.platformConfig.minimumStakingPeriod || 0
      );

      console.log(
        "⚙️ Minimum Staking Period:",
        minimumStakingPeriodSeconds / (24 * 60 * 60),
        "days"
      );

      // ✅ Calculate real-time earnings for each NFT
      const processedNFTs: NFTData[] = userNFTs.map((nft: any) => {
        const tokenId = Number(nft.tokenId);
        const stakingSince = Number(nft.stakingSince || 0);
        const lastRewardCalculation = Number(
          nft.lastRewardCalculation || stakingSince
        );
        const canUnstakeTime = stakingSince + minimumStakingPeriodSeconds;

        let realtimeEarnings = 0;

        if (
          nft.isStaked &&
          stakingSince > 0 &&
          totalStakedGlobally > 0 &&
          currentRewardRate > 0
        ) {
          const timeSinceLastCalculation =
            currentTimeSeconds - lastRewardCalculation;
          const rewardPerSecondPerNFT = currentRewardRate / totalStakedGlobally;
          const newRewardsSinceCalculation =
            rewardPerSecondPerNFT * timeSinceLastCalculation;
          const existingPending = parseFloat(nft.pendingRewards || "0");
          realtimeEarnings = existingPending + newRewardsSinceCalculation;

          console.log(`NFT #${tokenId} Real-time Calculation:`);
          console.log(
            `  Staked Since: ${new Date(stakingSince * 1000).toISOString()}`
          );
          console.log(
            `  Last Checkpoint: ${new Date(
              lastRewardCalculation * 1000
            ).toISOString()}`
          );
          console.log(
            `  Time Elapsed: ${timeSinceLastCalculation}s (${(
              timeSinceLastCalculation / 3600
            ).toFixed(2)}h)`
          );
          console.log(
            `  Rate per NFT: ${rewardPerSecondPerNFT.toFixed(12)} ETH/s`
          );
          console.log(
            `  Earned Since Checkpoint: ${newRewardsSinceCalculation.toFixed(
              6
            )} ETH`
          );
          console.log(
            `  Total Real-time Earnings: ${realtimeEarnings.toFixed(6)} ETH`
          );
        }

        return {
          id: tokenId,
          tokenId: `#${tokenId.toString().padStart(4, "0")}`,
          status: nft.isStaked ? ("staked" as const) : ("unstaked" as const),
          stakingDuration: stakingSince
            ? calculateStakingDuration(stakingSince)
            : "Not staked",
          earnedRewards: `${realtimeEarnings.toFixed(6)} ETH`,
          realtimeEarnings: `${realtimeEarnings.toFixed(6)} ETH`,
          canUnstake:
            nft.isStaked &&
            stakingSince &&
            (minimumStakingPeriodSeconds === 0 ||
              currentTimeSeconds >= canUnstakeTime),
          nextUnstakeDate:
            nft.isStaked && stakingSince && canUnstakeTime > currentTimeSeconds
              ? formatDate(canUnstakeTime)
              : null,
          stakingSince,
        };
      });

      // Calculate dashboard totals
      const stakedNFTs = processedNFTs.filter((nft) => nft.status === "staked");
      const totalStaked = stakedNFTs.length;
      const totalOwned = processedNFTs.length;

      const totalEarningsCalculated = processedNFTs.reduce((sum, nft) => {
        const earned = parseFloat(nft.earnedRewards.replace(" ETH", ""));
        return sum + earned;
      }, 0);

      const claimableAmount = stakedNFTs.reduce((sum, nft) => {
        const earned = parseFloat(nft.realtimeEarnings.replace(" ETH", ""));
        return sum + earned;
      }, 0);

      console.log("📊 Dashboard Summary:");
      console.log(
        "  Total Real-time Earnings:",
        totalEarningsCalculated.toFixed(6),
        "ETH"
      );
      console.log("  Claimable Amount:", claimableAmount.toFixed(6), "ETH");
      console.log(
        "  Total Claimed (Historical):",
        parseFloat(userGraphQLData.user.totalRewardsClaimed || "0").toFixed(6),
        "ETH"
      );

      // Get config
      const baseAPR = platformGraphQLData?.platformConfig?.baseAPR
        ? parseFloat(platformGraphQLData.platformConfig.baseAPR)
        : 5.0;

      setDashboardData((prev) => ({
        ...prev,
        nftData: processedNFTs,
        stakingData: {
          ...prev.stakingData,
          totalOwned,
          totalStaked,
          totalRewards: `${totalEarningsCalculated.toFixed(6)} ETH`,
          minimumStakingPeriod: Math.floor(
            minimumStakingPeriodSeconds / (24 * 60 * 60)
          ),
          currentRewardRate: `${currentRewardRate.toFixed(10)} ETH/sec`,
          estimatedAPR: baseAPR,
          currentAPY: platformGraphQLData?.platformStats?.currentAPY
            ? parseFloat(platformGraphQLData.platformStats.currentAPY)
            : 0,
          totalStakedGlobally,
        },
        earningsData: {
          ...prev.earningsData,
          totalEarnings: `${totalEarningsCalculated.toFixed(6)} ETH`,
          claimableAmount: `${claimableAmount.toFixed(6)} ETH`,
          realtimeClaimable: `${claimableAmount.toFixed(6)} ETH`,
        },
        isLoading: false,
        error: null,
      }));

      console.log("✅ Dashboard updated with real-time calculations!");
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        error: "Failed to fetch dashboard data",
        isLoading: false,
      }));
    } finally {
      fetchInProgress.current = false;
    }
  }, [
    address,
    userGraphQLData,
    platformGraphQLData,
    platformConfigData,
    calculateStakingDuration,
    formatDate,
  ]);

  // Transaction functions
  const stakeNFTs = useCallback(
    async (tokenIds: number[]) => {
      if (!contract || !provider || tokenIds.length === 0) {
        throw new Error("Contract not ready or no tokens to stake");
      }

      setTransactionState({
        isLoading: true,
        status: "pending",
        transactionHash: null,
        error: null,
      });

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        let tx;

        if (tokenIds.length === 1) {
          tx = await (contractWithSigner as any).stakeToken(tokenIds[0]);
        } else {
          tx = await (contractWithSigner as any).stakeMultipleTokens(tokenIds);
        }

        await tx.wait();

        setTransactionState({
          isLoading: false,
          status: "success",
          transactionHash: tx.hash,
          error: null,
        });

        toast({
          title: "NFTs Staked Successfully! 🎉",
          description: `Successfully staked ${tokenIds.length} NFT${
            tokenIds.length > 1 ? "s" : ""
          }`,
        });

        setTimeout(() => {
          fetchDashboardData();
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        const errorMessage =
          error.code === "ACTION_REJECTED"
            ? "Transaction was rejected by user"
            : error.reason || "Staking failed";

        setTransactionState({
          isLoading: false,
          status: "error",
          transactionHash: null,
          error: errorMessage,
        });

        toast({
          title: "Staking Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      }
    },
    [
      contract,
      provider,
      toast,
      fetchDashboardData,
      refetchUserData,
      refetchPlatformData,
    ]
  );

  const unstakeNFTs = useCallback(
    async (tokenIds: number[]) => {
      if (!contract || !provider || tokenIds.length === 0) {
        throw new Error("Contract not ready or no tokens to unstake");
      }

      setTransactionState({
        isLoading: true,
        status: "pending",
        transactionHash: null,
        error: null,
      });

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        let tx;

        if (tokenIds.length === 1) {
          tx = await (contractWithSigner as any).unstakeToken(tokenIds[0]);
        } else {
          tx = await (contractWithSigner as any).unstakeMultipleTokens(
            tokenIds
          );
        }

        await tx.wait();

        setTransactionState({
          isLoading: false,
          status: "success",
          transactionHash: tx.hash,
          error: null,
        });

        toast({
          title: "NFTs Unstaked Successfully! 🎉",
          description: `Successfully unstaked ${tokenIds.length} NFT${
            tokenIds.length > 1 ? "s" : ""
          }`,
        });

        setTimeout(() => {
          fetchDashboardData();
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        const errorMessage =
          error.code === "ACTION_REJECTED"
            ? "Transaction was rejected by user"
            : error.reason || "Unstaking failed";

        setTransactionState({
          isLoading: false,
          status: "error",
          transactionHash: null,
          error: errorMessage,
        });

        toast({
          title: "Unstaking Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      }
    },
    [
      contract,
      provider,
      toast,
      fetchDashboardData,
      refetchUserData,
      refetchPlatformData,
    ]
  );

  const claimRewards = useCallback(
    async (tokenIds?: number[]) => {
      if (!contract || !provider) {
        throw new Error("Contract not ready");
      }

      const tokensToClaimFor =
        tokenIds ||
        dashboardData.nftData
          .filter(
            (nft) =>
              nft.status === "staked" &&
              parseFloat((nft.earnedRewards || "0 ETH").replace(" ETH", "")) > 0
          )
          .map((nft) => nft.id);

      if (tokensToClaimFor.length === 0) {
        throw new Error("No rewards to claim");
      }

      setTransactionState({
        isLoading: true,
        status: "pending",
        transactionHash: null,
        error: null,
      });

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        let tx;

        if (tokensToClaimFor.length === 1) {
          tx = await (contractWithSigner as any).claimRewards(
            tokensToClaimFor[0]
          );
        } else {
          tx = await (contractWithSigner as any).claimMultipleRewards(
            tokensToClaimFor
          );
        }

        await tx.wait();

        setTransactionState({
          isLoading: false,
          status: "success",
          transactionHash: tx.hash,
          error: null,
        });

        toast({
          title: "Rewards Claimed Successfully! 🎉",
          description: `Successfully claimed rewards for ${
            tokensToClaimFor.length
          } NFT${tokensToClaimFor.length > 1 ? "s" : ""}`,
        });

        setTimeout(() => {
          fetchDashboardData();
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        const errorMessage =
          error.code === "ACTION_REJECTED"
            ? "Transaction was rejected by user"
            : error.reason || "Claiming failed";

        setTransactionState({
          isLoading: false,
          status: "error",
          transactionHash: null,
          error: errorMessage,
        });

        toast({
          title: "Claiming Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      }
    },
    [
      contract,
      provider,
      dashboardData.nftData,
      toast,
      fetchDashboardData,
      refetchUserData,
      refetchPlatformData,
    ]
  );

  const claimAllRewards = useCallback(
    async () => claimRewards(),
    [claimRewards]
  );

  const resetTransactionState = useCallback(() => {
    setTransactionState({
      isLoading: false,
      status: "idle",
      transactionHash: null,
      error: null,
    });
  }, []);

  const refreshData = useCallback(async () => {
    await fetchDashboardData();
    await Promise.all([
      refetchUserData(),
      refetchPlatformData(),
      refetchPlatformConfig(),
    ]);
  }, [
    fetchDashboardData,
    refetchUserData,
    refetchPlatformData,
    refetchPlatformConfig,
  ]);

  // Main effect to trigger data fetching with aggressive fallback
  useEffect(() => {
    console.log("🎯 Main Effect Triggered:", {
      hasAddress: !!address,
      hasUserData: !!userGraphQLData?.user,
      userNFTsCount: userGraphQLData?.user?.nfts?.length || 0,
      hasConfig: !!platformConfigData?.platformConfig,
      hasPlatformData: !!platformGraphQLData,
      fetchInProgress: fetchInProgress.current,
      userLoading: userGraphQLLoading,
      platformLoading: platformGraphQLLoading,
      configLoading: platformConfigLoading,
    });

    // Primary trigger: all data loaded
    if (
      address &&
      userGraphQLData?.user &&
      platformConfigData?.platformConfig &&
      !fetchInProgress.current
    ) {
      console.log("🚀 All conditions met - triggering dashboard fetch");
      fetchDashboardData();
      return;
    }

    // Fallback trigger: user has data but config might be slow
    // If we have user data and address, try to fetch even without full config
    if (
      address &&
      userGraphQLData?.user &&
      !fetchInProgress.current &&
      !platformConfigLoading
    ) {
      console.log("⚡ Fallback trigger - fetching with partial data");
      fetchDashboardData();
      return;
    }

    console.log("⏸️ Conditions not met yet - waiting for data");
  }, [
    address,
    userGraphQLData?.user?.id,
    platformConfigData?.platformConfig?.minimumStakingPeriod,
    platformGraphQLData?.platformStats,
    userGraphQLLoading,
    platformGraphQLLoading,
    platformConfigLoading,
    fetchDashboardData,
  ]);

  // Refresh data after successful transactions
  useEffect(() => {
    if (transactionState.status === "success") {
      const refreshTimer = setTimeout(() => fetchDashboardData(), 3000);
      return () => clearTimeout(refreshTimer);
    }
  }, [transactionState.status, fetchDashboardData]);

  // Enhanced error handling with timeout protection
  const error =
    dashboardData.error ||
    (userGraphQLError
      ? `GraphQL User Error: ${userGraphQLError.message}`
      : null) ||
    (platformGraphQLError
      ? `GraphQL Platform Error: ${platformGraphQLError.message}`
      : null) ||
    (platformConfigError
      ? `GraphQL Config Error: ${platformConfigError.message}`
      : null);

  const isLoading =
    dashboardData.isLoading ||
    userGraphQLLoading ||
    platformGraphQLLoading ||
    platformConfigLoading;

  // Prevent infinite loading - if loading for more than 30 seconds with connected wallet, force show data
  useEffect(() => {
    if (isLoading && address && isConnected) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Loading timeout - forcing data display");
        if (fetchInProgress.current) {
          fetchInProgress.current = false;
        }
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error: prev.error || "Loading took too long - please refresh",
        }));
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, address, isConnected]);

  return {
    nftData: dashboardData.nftData,
    stakingData: dashboardData.stakingData,
    earningsData: dashboardData.earningsData,
    isLoading,
    error,
    transactionState,
    stakeNFTs,
    unstakeNFTs,
    claimRewards,
    claimAllRewards,
    refreshData,
    resetTransactionState,
    isContractReady: !!contract && !!provider,
    isReadOnlyReady: !!readOnlyContract,
    hasGraphQLData: !!userGraphQLData || !!platformGraphQLData,
    graphqlUserData: userGraphQLData,
    graphqlPlatformData: platformGraphQLData,

    platformConfig: platformConfigData?.platformConfig || null,
    minimumStakingPeriodDays: platformConfigData?.platformConfig
      ?.minimumStakingPeriod
      ? Math.floor(
          Number(platformConfigData.platformConfig.minimumStakingPeriod) /
            (24 * 60 * 60)
        )
      : 7,
    emergencyWithdrawEnabled:
      platformConfigData?.platformConfig?.emergencyWithdrawEnabled || false,

    refreshConfig: refetchPlatformConfig,

    resetFetch: () => {
      fetchInProgress.current = false;
      console.log("🔄 Emergency reset of fetchInProgress");
    },
  };
};
