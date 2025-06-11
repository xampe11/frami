// hooks/useFounderNFTDashboard.ts - ENHANCED VERSION
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useQuery } from "@apollo/client";
import { useWallet } from "@/contexts/wallet-context";
import { contractConfig } from "../contracts/config";
import { useToast } from "@/hooks/use-toast";
import {
  GET_USER_DASHBOARD,
  GET_PLATFORM_STATS,
} from "@/graphql/graphql-queries";

const FOUNDER_NFT_ABI = contractConfig.contracts.FounderNFT.abi;

// Keep all your existing interfaces
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

  // Keep all your existing state
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    nftData: [],
    stakingData: {
      totalStaked: 0,
      totalOwned: 0,
      currentAPY: 0,
      totalRewards: "0",
      minimumStakingPeriod: 7,
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

  // NEW: Add GraphQL queries
  const {
    data: userGraphQLData,
    loading: userGraphQLLoading,
    error: userGraphQLError,
    refetch: refetchUserData,
  } = useQuery(GET_USER_DASHBOARD, {
    variables: { userAddress: address?.toLowerCase() || "" },
    skip: !address,
    pollInterval: 30000, // Poll every 30 seconds
    errorPolicy: "all",
  });

  const {
    data: platformGraphQLData,
    loading: platformGraphQLLoading,
    error: platformGraphQLError,
    refetch: refetchPlatformData,
  } = useQuery(GET_PLATFORM_STATS, {
    pollInterval: 60000, // Poll every minute
    errorPolicy: "all",
  });

  // Keep ALL your existing initialization code exactly as is
  useEffect(() => {
    const initializeReadOnlyProvider = async () => {
      try {
        const rpcUrl = "http://127.0.0.1:8545";
        const readProvider = new ethers.JsonRpcProvider(rpcUrl);
        const readContract = new ethers.Contract(
          contractConfig.contracts.FounderNFT.address,
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

  useEffect(() => {
    const initializeWalletProvider = async () => {
      if (!isConnected || typeof window === "undefined" || !window.ethereum)
        return;
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const network = await web3Provider.getNetwork();
        if (Number(network.chainId) !== contractConfig.chainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${contractConfig.chainId.toString(16)}` }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${contractConfig.chainId.toString(16)}`,
                    chainName: "Anvil Local",
                    rpcUrls: ["http://127.0.0.1:8545"],
                    nativeCurrency: {
                      name: "Ethereum",
                      symbol: "ETH",
                      decimals: 18,
                    },
                  },
                ],
              });
            }
          }
        }
        const walletContract = new ethers.Contract(
          contractConfig.contracts.FounderNFT.address,
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

  // Keep all your existing helper functions
  const getUserTokenIds = useCallback(
    async (userContract: ethers.Contract): Promise<number[]> => {
      if (!address) return [];
      try {
        const balance = await userContract.balanceOf(address);
        const tokenIds: number[] = [];
        for (let i = 0; i < Number(balance); i++) {
          const tokenId = await userContract.tokenOfOwnerByIndex(address, i);
          tokenIds.push(Number(tokenId));
        }
        return tokenIds;
      } catch (error) {
        console.error("Failed to get user token IDs:", error);
        return [];
      }
    },
    [address]
  );

  const calculateStakingDuration = (stakingSince: number): string => {
    if (stakingSince === 0) return "0 days";
    const now = Math.floor(Date.now() / 1000);
    const duration = Math.floor((now - stakingSince) / (24 * 60 * 60));
    return `${duration} days`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString().split("T")[0];
  };

  const calculateRealtimeEarnings = useCallback(
    async (tokenId: number, baseEarnings: string): Promise<string> => {
      if (!readOnlyContract) return baseEarnings;
      try {
        const currentEarned = await readOnlyContract.earned(tokenId);
        return ethers.formatEther(currentEarned);
      } catch (error) {
        console.warn("Failed to get real-time earnings:", error);
        return baseEarnings;
      }
    },
    [readOnlyContract]
  );

  // NEW: Helper function to merge contract and GraphQL data
  const mergeContractAndGraphQLData = useCallback(
    (contractNftData: NFTData[]): NFTData[] => {
      if (!userGraphQLData?.user?.nfts) return contractNftData;

      // Create a map of GraphQL data by tokenId for quick lookup
      const graphqlMap = new Map();
      userGraphQLData.user.nfts.forEach((nft: any) => {
        graphqlMap.set(Number(nft.tokenId), nft);
      });

      // Merge contract data with GraphQL data
      return contractNftData.map((contractNft) => {
        const graphqlNft = graphqlMap.get(contractNft.id);

        if (graphqlNft) {
          // Use GraphQL data where available, fallback to contract data
          return {
            ...contractNft,
            // You can choose which data source to prioritize
            earnedRewards: graphqlNft.totalRewardsEarned
              ? `${parseFloat(graphqlNft.totalRewardsEarned).toFixed(6)} ETH`
              : contractNft.earnedRewards,
            // Keep contract data for real-time earnings
            realtimeEarnings: contractNft.realtimeEarnings,
          };
        }

        return contractNft;
      });
    },
    [userGraphQLData]
  );

  // ENHANCED: Updated fetchDashboardData to use GraphQL data when available
  const fetchDashboardData = useCallback(async () => {
    if (!contract || !address || !readOnlyContract) return;

    try {
      setDashboardData((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // Get user's token IDs (keep using contract for this)
      const tokenIds = await getUserTokenIds(contract);

      if (tokenIds.length === 0) {
        // Check GraphQL for user data even if contract says no tokens
        const graphqlOwned = userGraphQLData?.user?.totalNFTsOwned || 0;
        const graphqlStaked = userGraphQLData?.user?.totalNFTsStaked || 0;

        setDashboardData((prev) => ({
          ...prev,
          nftData: [],
          stakingData: {
            ...prev.stakingData,
            totalOwned: graphqlOwned,
            totalStaked: graphqlStaked,
          },
          isLoading: false,
        }));
        return;
      }

      // Get contract data using your existing functions
      const [
        minimumStakingPeriod,
        currentRewardRate,
        estimatedAPR,
        totalStakedSupply,
      ] = await Promise.all([
        readOnlyContract.getMinimumStakingPeriod(),
        readOnlyContract.getCurrentRewardRate().catch(() => 0),
        readOnlyContract.getEstimatedAPR().catch(() => 0),
        readOnlyContract.getTotalStakedSupply().catch(() => 0),
      ]);

      // Process each NFT with contract data
      const nftDataPromises = tokenIds.map(
        async (tokenId): Promise<NFTData> => {
          const [isStaked, stakingInfo] = await Promise.all([
            contract.isTokenStaked(tokenId),
            contract.getStakingInfo(tokenId),
          ]);

          const [owner, stakingSince] = stakingInfo;

          let earnedAmount = "0";
          let realtimeAmount = "0";

          if (isStaked) {
            try {
              const earned = await readOnlyContract.earned(tokenId);
              earnedAmount = ethers.formatEther(earned);
              realtimeAmount = earnedAmount;
            } catch (error) {
              console.warn(
                `Failed to get earned amount for token ${tokenId}:`,
                error
              );
            }
          }

          const canUnstake =
            isStaked &&
            Date.now() / 1000 >=
              Number(stakingSince) + Number(minimumStakingPeriod);

          const nextUnstakeDate =
            isStaked && !canUnstake
              ? formatDate(Number(stakingSince) + Number(minimumStakingPeriod))
              : null;

          return {
            id: tokenId,
            tokenId: `#${tokenId.toString().padStart(4, "0")}`,
            status: isStaked ? "staked" : "unstaked",
            stakingDuration: calculateStakingDuration(Number(stakingSince)),
            earnedRewards: `${parseFloat(earnedAmount).toFixed(6)} ETH`,
            realtimeEarnings: `${parseFloat(realtimeAmount).toFixed(6)} ETH`,
            nextUnstakeDate,
            canUnstake,
            stakingSince: Number(stakingSince),
          };
        }
      );

      const contractNftData = await Promise.all(nftDataPromises);

      // NEW: Merge with GraphQL data
      const mergedNftData = mergeContractAndGraphQLData(contractNftData);

      // Calculate totals (prioritize GraphQL data if available)
      const totalStaked =
        userGraphQLData?.user?.totalNFTsStaked !== undefined
          ? userGraphQLData.user.totalNFTsStaked
          : mergedNftData.filter((nft) => nft.status === "staked").length;

      const totalOwned =
        userGraphQLData?.user?.totalNFTsOwned !== undefined
          ? userGraphQLData.user.totalNFTsOwned
          : tokenIds.length;

      const totalEarnings =
        userGraphQLData?.user?.totalRewardsEarned !== undefined
          ? parseFloat(userGraphQLData.user.totalRewardsEarned)
          : mergedNftData.reduce((sum, nft) => {
              return sum + parseFloat(nft.earnedRewards.replace(" ETH", ""));
            }, 0);

      // Use platform GraphQL data if available
      const globalStaked =
        platformGraphQLData?.platformStats?.totalNFTsStaked !== undefined
          ? platformGraphQLData.platformStats.totalNFTsStaked
          : Number(totalStakedSupply);

      const currentGraphQLRewardRate =
        platformGraphQLData?.platformStats?.currentRewardRate;

      setDashboardData((prev) => ({
        ...prev,
        nftData: mergedNftData,
        stakingData: {
          ...prev.stakingData,
          totalOwned,
          totalStaked,
          totalRewards: `${totalEarnings.toFixed(6)} ETH`,
          minimumStakingPeriod: Math.floor(
            Number(minimumStakingPeriod) / (24 * 60 * 60)
          ),
          currentRewardRate:
            currentGraphQLRewardRate ||
            `${ethers.formatEther(currentRewardRate)} ETH/sec`,
          estimatedAPR: Number(estimatedAPR) / 100,
          currentAPY: Number(estimatedAPR) / 100,
          totalStakedGlobally: globalStaked,
        },
        earningsData: {
          ...prev.earningsData,
          totalEarnings: `${totalEarnings.toFixed(6)} ETH`,
          claimableAmount: `${totalEarnings.toFixed(6)} ETH`,
          realtimeClaimable: `${totalEarnings.toFixed(6)} ETH`,
        },
        isLoading: false,
      }));

      console.log("Dashboard data fetched and merged:", {
        tokenIds,
        totalStaked,
        totalEarnings,
        globalStaked,
        hasGraphQLData: !!userGraphQLData,
        hasPlatformData: !!platformGraphQLData,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        error: "Failed to fetch dashboard data",
        isLoading: false,
      }));
    }
  }, [
    contract,
    address,
    readOnlyContract,
    getUserTokenIds,
    userGraphQLData,
    platformGraphQLData,
    mergeContractAndGraphQLData,
  ]);

  // ENHANCED: Update the effect to refetch GraphQL data after transactions
  const stakeNFTs = useCallback(
    async (tokenIds: number[]) => {
      // Keep your entire existing stakeNFTs implementation
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
          try {
            tx = await (contractWithSigner as any).stakeMultipleTokens(
              tokenIds
            );
          } catch (error: any) {
            console.warn(
              "Batch staking failed, falling back to individual staking:",
              error
            );
            for (const tokenId of tokenIds) {
              const individualTx = await (contractWithSigner as any).stakeToken(
                tokenId
              );
              await individualTx.wait();
              setTransactionState((prev) => ({
                ...prev,
                transactionHash: individualTx.hash,
              }));
            }

            setTransactionState({
              isLoading: false,
              status: "success",
              transactionHash: null,
              error: null,
            });

            toast({
              title: "NFTs Staked Successfully! 🎉",
              description: `Successfully staked ${tokenIds.length} NFT${
                tokenIds.length > 1 ? "s" : ""
              } individually. Rewards start accruing immediately!`,
            });

            // NEW: Refresh both contract and GraphQL data
            await fetchDashboardData();
            setTimeout(() => {
              refetchUserData();
              refetchPlatformData();
            }, 2000); // Give subgraph time to index
            return;
          }
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
          }. Rewards start accruing immediately!`,
        });

        // NEW: Refresh both contract and GraphQL data
        await fetchDashboardData();
        setTimeout(() => {
          refetchUserData();
          refetchPlatformData();
        }, 2000); // Give subgraph time to index
      } catch (error: any) {
        console.error("Staking failed:", error);
        let errorMessage = "Staking failed";
        if (error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected by user";
        } else if (error.reason) {
          errorMessage = error.reason;
        } else if (error.message) {
          errorMessage = error.message;
        }

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

  // Update unstakeNFTs and claimRewards similarly...
  const unstakeNFTs = useCallback(
    async (tokenIds: number[]) => {
      // Keep your entire existing implementation, just add GraphQL refresh at the end
      if (!contract || !provider || tokenIds.length === 0) {
        throw new Error("Contract not ready or no tokens to unstake");
      }

      // ... keep all your existing unstaking logic ...
      // (I'm shortening this for space, but keep everything the same)

      try {
        // ... your existing implementation ...

        // At the end, after successful unstaking:
        await fetchDashboardData();
        setTimeout(() => {
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        // ... your existing error handling ...
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
      // Keep your entire existing implementation, just add GraphQL refresh at the end
      // ... same pattern as above ...
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

  // Keep all your other existing functions exactly as they are
  const claimAllRewards = useCallback(async () => {
    return claimRewards();
  }, [claimRewards]);

  const resetTransactionState = useCallback(() => {
    setTransactionState({
      isLoading: false,
      status: "idle",
      transactionHash: null,
      error: null,
    });
  }, []);

  // Keep all your existing useEffect hooks exactly as they are
  useEffect(() => {
    if (contract && address && readOnlyContract) {
      fetchDashboardData();
    }
  }, [contract, address, readOnlyContract, fetchDashboardData]);

  useEffect(() => {
    if (transactionState.status === "success") {
      const refreshTimer = setTimeout(() => {
        fetchDashboardData();
      }, 2000);
      return () => clearTimeout(refreshTimer);
    }
  }, [transactionState.status, fetchDashboardData]);

  // Keep your real-time earnings update effect
  useEffect(() => {
    if (!readOnlyContract || !dashboardData.nftData.length) return;
    // ... keep your existing real-time update logic ...
  }, [readOnlyContract, dashboardData.nftData.length]);

  // NEW: Enhanced refresh function that includes GraphQL
  const refreshData = useCallback(async () => {
    await fetchDashboardData();
    await Promise.all([refetchUserData(), refetchPlatformData()]);
  }, [fetchDashboardData, refetchUserData, refetchPlatformData]);

  // NEW: Combined loading state
  const isLoading =
    dashboardData.isLoading || userGraphQLLoading || platformGraphQLLoading;

  // NEW: Combined error state
  const error =
    dashboardData.error ||
    (userGraphQLError
      ? `GraphQL User Error: ${userGraphQLError.message}`
      : null) ||
    (platformGraphQLError
      ? `GraphQL Platform Error: ${platformGraphQLError.message}`
      : null);

  return {
    // Data (enhanced with GraphQL)
    nftData: dashboardData.nftData,
    stakingData: dashboardData.stakingData,
    earningsData: dashboardData.earningsData,

    // Enhanced states
    isLoading,
    error,

    // Transaction state
    transactionState,

    // Actions (enhanced to refresh GraphQL)
    stakeNFTs,
    unstakeNFTs,
    claimRewards,
    claimAllRewards,
    refreshData, // Now includes GraphQL refresh
    resetTransactionState,

    // Status
    isContractReady: !!contract && !!provider,
    isReadOnlyReady: !!readOnlyContract,

    // NEW: GraphQL status
    hasGraphQLData: !!userGraphQLData || !!platformGraphQLData,
    graphqlUserData: userGraphQLData,
    graphqlPlatformData: platformGraphQLData,
  };
};
