// hooks/useFounderNFTDashboard.ts - COMPLETE FIXED VERSION
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
  realtimeEarnings?: string;
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

  const {
    data: userGraphQLData,
    loading: userGraphQLLoading,
    error: userGraphQLError,
    refetch: refetchUserData,
  } = useQuery(GET_USER_DASHBOARD, {
    variables: { userAddress: address?.toLowerCase() || "" },
    skip: !address,
    pollInterval: 30000,
    errorPolicy: "all",
  });

  const {
    data: platformGraphQLData,
    loading: platformGraphQLLoading,
    error: platformGraphQLError,
    refetch: refetchPlatformData,
  } = useQuery(GET_PLATFORM_STATS, {
    pollInterval: 60000,
    errorPolicy: "all",
  });

  // Initialize read-only provider
  useEffect(() => {
    const initializeReadOnlyProvider = async () => {
      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL;
        const readProvider = new ethers.JsonRpcProvider(rpcUrl);
        const readContract = new ethers.Contract(
          FOUNDER_NFT_ADDRESS,
          FOUNDER_NFT_ABI,
          readProvider
        );
        setReadOnlyContract(readContract);
      } catch (error) {
        console.error("Failed to initialize read-only provider:", error);
        setDashboardData((prev) => ({
          ...prev,
          error: "Failed to connect to contract",
          isLoading: false,
        }));
      }
    };
    initializeReadOnlyProvider();
  }, []);

  // Initialize wallet provider
  useEffect(() => {
    const initializeWalletProvider = async () => {
      if (!isConnected || typeof window === "undefined" || !window.ethereum)
        return;
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const network = await web3Provider.getNetwork();
        if (Number(network.chainId) !== CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
            });
          } catch (switchError: any) {
            console.log("Network does not exist");
          }
        }
        const walletContract = new ethers.Contract(
          FOUNDER_NFT_ADDRESS,
          FOUNDER_NFT_ABI,
          web3Provider
        );
        setProvider(web3Provider);
        setContract(walletContract);
      } catch (error) {
        console.error("Failed to initialize wallet provider:", error);
      }
    };
    initializeWalletProvider();
  }, [isConnected]);

  const calculateStakingDuration = (stakingSince: number): string => {
    if (stakingSince === 0) return "0 days";
    const now = Math.floor(Date.now() / 1000);
    const duration = Math.floor((now - stakingSince) / (24 * 60 * 60));
    return `${duration} days`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString().split("T")[0];
  };

  // FIXED: fetchDashboardData with proper flag management
  const fetchDashboardData = useCallback(async () => {
    if (fetchInProgress.current) {
      console.log("⚠️ Fetch in progress but continuing anyway");
    }
    fetchInProgress.current = true;

    if (!contract || !address || !readOnlyContract) {
      console.log("Missing dependencies, skipping fetch");
      return;
    }

    try {
      setDashboardData((prev) => ({ ...prev, isLoading: true, error: null }));
      console.log("🔍 Using GraphQL-first approach");

      if (!userGraphQLData?.user?.nfts) {
        console.log("❌ No GraphQL data available");
        setDashboardData((prev) => ({
          ...prev,
          isLoading: false,
          error: "No NFT data available",
        }));
        fetchInProgress.current = false;
        return;
      }

      const userNFTs = userGraphQLData.user.nfts.filter(
        (nft: any) =>
          nft.currentStaker?.id?.toLowerCase() === address.toLowerCase()
      );

      const processedNFTs: NFTData[] = userNFTs.map((nft: any) => {
        const stakingSince = Number(nft.stakingSince || 0);
        const currentTime = Math.floor(Date.now() / 1000);
        const minimumStakingPeriod = 7 * 24 * 60 * 60;
        const canUnstakeTime = stakingSince + minimumStakingPeriod;

        return {
          id: Number(nft.tokenId),
          tokenId: `#${nft.tokenId.toString().padStart(4, "0")}`,
          status: nft.isStaked ? ("staked" as const) : ("unstaked" as const),
          stakingDuration: calculateStakingDuration(stakingSince),
          earnedRewards: `${parseFloat(nft.totalRewardsEarned || "0").toFixed(
            6
          )} ETH`,
          realtimeEarnings: `${parseFloat(
            nft.totalRewardsEarned || "0"
          ).toFixed(6)} ETH`,
          canUnstake:
            nft.isStaked &&
            (minimumStakingPeriod === 0 || currentTime >= canUnstakeTime),
          nextUnstakeDate:
            nft.isStaked && canUnstakeTime > currentTime
              ? formatDate(canUnstakeTime)
              : null,
          stakingSince,
        };
      });

      const totalStaked = processedNFTs.filter(
        (nft) => nft.status === "staked"
      ).length;
      const totalOwned =
        userGraphQLData.user.totalNFTsOwned || processedNFTs.length;
      const totalEarnings = userGraphQLData.user.totalRewardsEarned
        ? parseFloat(userGraphQLData.user.totalRewardsEarned)
        : 0;

      setDashboardData((prev) => ({
        ...prev,
        nftData: processedNFTs,
        stakingData: {
          ...prev.stakingData,
          totalOwned,
          totalStaked,
          totalRewards: `${totalEarnings.toFixed(6)} ETH`,
          minimumStakingPeriod: 7,
          currentRewardRate:
            platformGraphQLData?.platformStats?.currentRewardRate ||
            "0 ETH/sec",
          estimatedAPR: 0,
          currentAPY: 0,
          totalStakedGlobally:
            platformGraphQLData?.platformStats?.totalNFTsStaked || 0,
        },
        earningsData: {
          ...prev.earningsData,
          totalEarnings: `${totalEarnings.toFixed(6)} ETH`,
          claimableAmount: `${totalEarnings.toFixed(6)} ETH`,
          realtimeClaimable: `${totalEarnings.toFixed(6)} ETH`,
        },
        isLoading: false,
        error: null,
      }));

      console.log("🎉 Dashboard data updated successfully!");
      fetchInProgress.current = false;
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        error: "Failed to fetch dashboard data",
        isLoading: false,
      }));
      fetchInProgress.current = false;
    }
  }, [
    contract,
    address,
    readOnlyContract,
    userGraphQLData,
    platformGraphQLData,
    calculateStakingDuration,
    formatDate,
  ]);

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
          }.`,
        });

        await fetchDashboardData();
        setTimeout(() => {
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        const errorMessage =
          error.code === "ACTION_REJECTED"
            ? "Transaction was rejected by user"
            : error.reason || error.message || "Staking failed";
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
        const contractWithSigner = contract.connect(signer) as any;
        let tx;

        if (tokenIds.length === 1) {
          tx = await contractWithSigner.unstakeToken(tokenIds[0]);
        } else {
          tx = await contractWithSigner.unstakeMultipleTokens(tokenIds);
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
          }.`,
        });

        await fetchDashboardData();
        setTimeout(() => {
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        const errorMessage =
          error.code === "ACTION_REJECTED"
            ? "Transaction was rejected by user"
            : error.reason || error.message || "Unstaking failed";
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
      if (!contract || !provider) throw new Error("Contract not ready");

      setTransactionState({
        isLoading: true,
        status: "pending",
        transactionHash: null,
        error: null,
      });

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        const tokensToClaimFor =
          tokenIds ||
          dashboardData.nftData
            .filter((nft) => nft.status === "staked")
            .map((nft) => nft.id);

        if (tokensToClaimFor.length === 0)
          throw new Error("No staked tokens to claim rewards for");

        let tx;
        if (tokensToClaimFor.length === 1) {
          tx = await (contractWithSigner as any).claimReward(
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

        await fetchDashboardData();
        setTimeout(() => {
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

  // FIXED: Main useEffect with proper flag management
  useEffect(() => {
    if (
      contract &&
      address &&
      readOnlyContract &&
      userGraphQLData?.user &&
      !fetchInProgress.current
    ) {
      fetchInProgress.current = true;
      console.log("🚀 Triggering dashboard fetch");

      fetchDashboardData().finally(() => {
        console.log("🔄 Resetting fetchInProgress flag");
        fetchInProgress.current = false;
      });
    }
  }, [contract, address, readOnlyContract, userGraphQLData?.user?.id]);

  useEffect(() => {
    if (transactionState.status === "success") {
      const refreshTimer = setTimeout(() => fetchDashboardData(), 2000);
      return () => clearTimeout(refreshTimer);
    }
  }, [transactionState.status, fetchDashboardData]);

  const error =
    dashboardData.error ||
    (userGraphQLError
      ? `GraphQL User Error: ${userGraphQLError.message}`
      : null) ||
    (platformGraphQLError
      ? `GraphQL Platform Error: ${platformGraphQLError.message}`
      : null);

  return {
    nftData: dashboardData.nftData,
    stakingData: dashboardData.stakingData,
    earningsData: dashboardData.earningsData,
    isLoading: dashboardData.isLoading,
    error: error,
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
    resetFetch: () => {
      fetchInProgress.current = false;
      console.log("🔄 Emergency reset of fetchInProgress");
    },
  };
};
