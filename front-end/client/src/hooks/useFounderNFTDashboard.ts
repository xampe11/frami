// hooks/useFounderNFTDashboard.ts - LATEST VERSION WITH DATABASE CONFIGURATION
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
  nextUnstakeDate: string | null;
  canUnstake: boolean;
  stakingSince?: number;
  realtimeEarnings?: string; // Optional - may not be available immediately
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

  // ENHANCED: Core data fetching logic with database-driven configuration
  const fetchDashboardData = useCallback(async () => {
    if (fetchInProgress.current) {
      console.log("⚠️ Fetch already in progress, skipping");
      return;
    }
    fetchInProgress.current = true;

    if (!address) {
      console.log("No wallet address, skipping fetch");
      fetchInProgress.current = false;
      return;
    }

    try {
      setDashboardData((prev) => ({ ...prev, isLoading: true, error: null }));
      console.log(
        "🔍 Using GraphQL-first approach with database configuration"
      );

      if (!userGraphQLData?.user) {
        console.log("❌ No GraphQL user data available");
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error: "No user data available",
        }));
        fetchInProgress.current = false;
        return;
      }

      // ✅ NEW: Get minimum staking period from database (not hardcoded!)
      const minimumStakingPeriodSeconds = platformConfigData?.platformConfig
        ?.minimumStakingPeriod
        ? Number(platformGraphQLData.platformConfig.minimumStakingPeriod)
        : 7 * 24 * 60 * 60; // Fallback only if database value not available

      console.log(
        `📅 Minimum staking period from DATABASE: ${minimumStakingPeriodSeconds} seconds (${Math.floor(
          minimumStakingPeriodSeconds / (24 * 60 * 60)
        )} days)`
      );

      // Get ALL user's NFTs (not just staked ones)
      const userNFTs = userGraphQLData.user.nfts || [];
      console.log(`📊 Processing ${userNFTs.length} user NFTs`);

      const processedNFTs: NFTData[] = userNFTs.map((nft: any) => {
        const stakingSince = Number(nft.stakingSince || 0);
        const currentTime = Math.floor(Date.now() / 1000);
        const canUnstakeTime = stakingSince + minimumStakingPeriodSeconds; // Using database value!

        // Safe parsing of reward values with fallbacks
        const totalRewards = parseFloat(nft.totalRewardsEarned || "0");
        const pendingRewards = parseFloat(nft.pendingRewards || "0");
        const realtimeRewards = Math.max(totalRewards, pendingRewards);

        return {
          id: Number(nft.tokenId),
          tokenId: `#${nft.tokenId.toString().padStart(4, "0")}`,
          status: nft.isStaked ? ("staked" as const) : ("unstaked" as const),
          stakingDuration: stakingSince
            ? calculateStakingDuration(stakingSince)
            : "Not staked",
          earnedRewards: `${totalRewards.toFixed(6)} ETH`,
          realtimeEarnings: `${realtimeRewards.toFixed(6)} ETH`,
          canUnstake:
            nft.isStaked &&
            stakingSince &&
            (minimumStakingPeriodSeconds === 0 ||
              currentTime >= canUnstakeTime),
          nextUnstakeDate:
            nft.isStaked && stakingSince && canUnstakeTime > currentTime
              ? formatDate(canUnstakeTime)
              : null,
          stakingSince,
        };
      });

      // Calculate stats from processed NFTs
      const stakedNFTs = processedNFTs.filter((nft) => nft.status === "staked");
      const totalStaked = stakedNFTs.length;
      const totalOwned = processedNFTs.length;
      const totalEarnings = userGraphQLData.user.totalRewardsEarned
        ? parseFloat(userGraphQLData.user.totalRewardsEarned)
        : 0;

      // Calculate claimable amount from NFTs with available data
      const claimableAmount = processedNFTs.reduce((sum, nft) => {
        const pendingRewards = parseFloat(
          (nft.realtimeEarnings || nft.earnedRewards || "0 ETH").replace(
            " ETH",
            ""
          )
        );
        return sum + (isNaN(pendingRewards) ? 0 : pendingRewards);
      }, 0);

      // ✅ NEW: Get additional configuration values from database
      const baseAPR = platformGraphQLData?.platformConfig?.baseAPR
        ? parseFloat(platformGraphQLData.platformConfig.baseAPR)
        : 5.0; // Fallback

      const emergencyWithdrawEnabled =
        platformGraphQLData?.platformConfig?.emergencyWithdrawEnabled || false;

      setDashboardData((prev) => ({
        ...prev,
        nftData: processedNFTs,
        stakingData: {
          ...prev.stakingData,
          totalOwned,
          totalStaked,
          totalRewards: `${totalEarnings.toFixed(6)} ETH`,
          minimumStakingPeriod: Math.floor(
            minimumStakingPeriodSeconds / (24 * 60 * 60)
          ), // Convert to days for display
          currentRewardRate:
            platformGraphQLData?.platformStats?.currentRewardRate || "0",
          estimatedAPR: baseAPR, // ✅ From database
          currentAPY: platformGraphQLData?.platformStats?.currentAPY
            ? parseFloat(platformGraphQLData.platformStats.currentAPY)
            : baseAPR,
          totalStakedGlobally:
            platformGraphQLData?.platformStats?.totalNFTsStaked || 0,
        },
        earningsData: {
          ...prev.earningsData,
          totalEarnings: `${totalEarnings.toFixed(6)} ETH`,
          claimableAmount: `${claimableAmount.toFixed(6)} ETH`,
          realtimeClaimable: `${claimableAmount.toFixed(6)} ETH`,
          platformFees: "0 ETH", // TODO: Add to subgraph if needed
          daoTokens: "0 ETH", // TODO: Add to subgraph if needed
        },
        isLoading: false,
        error: null,
      }));

      console.log(
        "🎉 Dashboard data updated successfully with database configuration!"
      );
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        error: `Failed to fetch dashboard data: ${error}`,
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

        // Refresh data after successful transaction
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
    await Promise.all([refetchUserData(), refetchPlatformData()]);
  }, [fetchDashboardData, refetchUserData, refetchPlatformData]);

  // Main effect to trigger data fetching
  useEffect(() => {
    if (address && userGraphQLData?.user && !fetchInProgress.current) {
      console.log("🚀 Triggering dashboard fetch with database configuration");
      fetchDashboardData();
    }
  }, [
    address,
    userGraphQLData?.user?.id,
    platformGraphQLData?.platformConfig?.minimumStakingPeriod,
    fetchDashboardData,
  ]);

  // Refresh data after successful transactions
  useEffect(() => {
    if (transactionState.status === "success") {
      const refreshTimer = setTimeout(() => fetchDashboardData(), 3000);
      return () => clearTimeout(refreshTimer);
    }
  }, [transactionState.status, fetchDashboardData]);

  // Enhanced error handling
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

    // ✅ NEW: Expose configuration data
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
