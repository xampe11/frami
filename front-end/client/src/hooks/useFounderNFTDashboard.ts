// hooks/useFounderNFTDashboard.ts - ENHANCED VERSION
import { useState, useEffect, useCallback } from "react";
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

  useEffect(() => {
    console.log("GraphQL Data Update:", {
      loading: userGraphQLLoading,
      error: userGraphQLError,
      data: userGraphQLData,
      userAddress: address?.toLowerCase(),
      totalNFTsOwned: userGraphQLData?.user?.totalNFTsOwned,
      totalNFTsStaked: userGraphQLData?.user?.totalNFTsStaked,
      nfts: userGraphQLData?.user?.nfts,
    });
  }, [userGraphQLData, userGraphQLLoading, userGraphQLError, address]);

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
            console.log("Network dows not exist");
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

  useEffect(() => {
    console.log("Hook states changed:", {
      contract: !!contract,
      address: !!address,
      readOnlyContract: !!readOnlyContract,
      isConnected,
      isLoading: dashboardData.isLoading,
    });
  }, [
    contract,
    address,
    readOnlyContract,
    isConnected,
    dashboardData.isLoading,
  ]);

  // Keep all your existing helper functions
  // Fixed getUserTokenIds with proper TypeScript event handling

  // Replace your getUserTokenIds with this simplified version that avoids RPC limits

  const getUserTokenIds = useCallback(
    async (userContract: ethers.Contract): Promise<number[]> => {
      if (!address) return [];

      try {
        console.log("🔍 Getting user tokens for:", address);

        // Step 1: Get wallet-owned tokens (unstaked)
        const balance = await userContract.balanceOf(address);
        const ownedTokenIds: number[] = [];

        for (let i = 0; i < Number(balance); i++) {
          const tokenId = await userContract.tokenOfOwnerByIndex(address, i);
          ownedTokenIds.push(Number(tokenId));
        }

        console.log("📦 Wallet-owned tokens:", ownedTokenIds);

        // Step 2: Get staked tokens from GraphQL (no RPC limits)
        let stakedTokenIds: number[] = [];

        if (userGraphQLData?.user?.nfts) {
          stakedTokenIds = userGraphQLData.user.nfts
            .filter((nft: any) => nft.isStaked)
            .map((nft: any) => Number(nft.tokenId));

          console.log("📊 GraphQL staked tokens:", stakedTokenIds);
        } else {
          console.log(
            "⚠️ No GraphQL user data - this means user hasn't interacted with contract yet"
          );
        }

        // Step 3: Combine both
        const allTokenIds = [...new Set([...ownedTokenIds, ...stakedTokenIds])];

        console.log("🎯 Final token list:", {
          owned: ownedTokenIds.length,
          staked: stakedTokenIds.length,
          total: allTokenIds.length,
          tokens: allTokenIds,
        });

        return allTokenIds;
      } catch (error) {
        console.error("Failed to get user token IDs:", error);
        return [];
      }
    },
    [address, userGraphQLData]
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
    (
      contractNftData: NFTData[],
      minimumStakingPeriodBigInt: any
    ): NFTData[] => {
      const minimumStakingPeriod = Number(minimumStakingPeriodBigInt);
      console.log("Merging data:", {
        contractNftData: contractNftData.length,
        contractNfts: contractNftData,
        graphqlNfts: userGraphQLData?.user?.nfts?.length || 0,
        graphqlData: userGraphQLData?.user?.nfts,
        hasGraphQLData: !!userGraphQLData?.user?.nfts,
        minimumStakingPeriod,
      });

      if (!userGraphQLData?.user?.nfts) {
        console.log("No GraphQL data, using contract data only");
        return contractNftData;
      }

      // Create sets of all NFT IDs
      const contractNftIds = contractNftData.map((nft) => nft.id);
      const graphqlNftIds = userGraphQLData.user.nfts.map((nft: any) =>
        Number(nft.tokenId)
      );

      console.log("🔍 NFT IDs:", {
        contractNftIds,
        graphqlNftIds,
        allIds: [...new Set([...contractNftIds, ...graphqlNftIds])],
      });

      const allNftIds = new Set([
        ...contractNftData.map((nft) => nft.id),
        ...userGraphQLData.user.nfts.map((nft: any) => Number(nft.tokenId)),
      ]);

      const contractNftMap = new Map();
      contractNftData.forEach((nft) => {
        contractNftMap.set(nft.id, nft);
      });

      // Create a map of GraphQL data by tokenId for quick lookup
      const graphqlMap = new Map();
      userGraphQLData.user.nfts.forEach((nft: any) => {
        graphqlMap.set(Number(nft.tokenId), nft);
      });

      const allNftData = Array.from(allNftIds)
        .map((tokenId) => {
          const contractNft = contractNftMap.get(tokenId);
          const graphqlNft = graphqlMap.get(tokenId);

          if (contractNft && graphqlNft) {
            // Both sources available - merge with contract priority for real-time data
            return {
              ...contractNft,
              earnedRewards: graphqlNft.totalRewardsEarned
                ? `${parseFloat(graphqlNft.totalRewardsEarned).toFixed(6)} ETH`
                : contractNft.earnedRewards,
              // Keep contract's canUnstake calculation
              canUnstake: contractNft.canUnstake,
            };
          } else if (graphqlNft) {
            const stakingSince = Number(graphqlNft.stakingSince || 0);
            const currentTime = Math.floor(Date.now() / 1000);
            const canUnstakeTime = stakingSince + minimumStakingPeriod;
            // Only GraphQL data available (for staked NFTs not in contract balance)
            return {
              id: Number(graphqlNft.tokenId),
              tokenId: `#${graphqlNft.tokenId.toString().padStart(4, "0")}`,
              status: graphqlNft.isStaked ? "staked" : "unstaked",
              stakingDuration: calculateStakingDuration(
                Number(graphqlNft.stakingSince || 0)
              ),
              earnedRewards: `${parseFloat(
                graphqlNft.totalRewardsEarned || "0"
              ).toFixed(6)} ETH`,
              realtimeEarnings: `${parseFloat(
                graphqlNft.totalRewardsEarned || "0"
              ).toFixed(6)} ETH`,
              // ✅ Calculate canUnstake for GraphQL-only NFTs
              canUnstake:
                graphqlNft.isStaked &&
                (minimumStakingPeriod === 0 || currentTime >= canUnstakeTime),
              nextUnstakeDate: null,
              stakingSince: Number(graphqlNft.stakingSince || 0),
            };
          } else {
            // Only contract data available
            return contractNft;
          }
        })
        .filter(Boolean);

      console.log("🔍 MERGE RESULT:", {
        resultLength: allNftData.length,
        result: allNftData.map((nft) => ({
          id: nft.id,
          tokenId: nft.tokenId,
          status: nft.status,
          canUnstake: nft.canUnstake,
        })),
      });

      return allNftData;
    },
    [userGraphQLData]
  );

  // ENHANCED: Updated fetchDashboardData to use GraphQL data when available
  const fetchDashboardData = useCallback(async () => {
    console.log("fetchDashboardData called with:", {
      contract: !!contract,
      address: !!address,
      readOnlyContract: !!readOnlyContract,
    });
    if (!contract || !address || !readOnlyContract) {
      console.log("Early return - missing dependencies");
      return;
    }

    try {
      setDashboardData((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const tokenIds = await getUserTokenIds(contract);

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

      let contractNftData: NFTData[] = [];

      // Process each NFT with contract data
      if (tokenIds.length > 0) {
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
              (Number(minimumStakingPeriod) === 0 ||
                Date.now() / 1000 >=
                  Number(stakingSince) + Number(minimumStakingPeriod));

            const nextUnstakeDate =
              isStaked && !canUnstake
                ? formatDate(
                    Number(stakingSince) + Number(minimumStakingPeriod)
                  )
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

        contractNftData = await Promise.all(nftDataPromises);
      }

      // Merge with GraphQL data
      const mergedNftData = mergeContractAndGraphQLData(
        contractNftData,
        minimumStakingPeriod
      );

      // Calculate totals (prioritize GraphQL data if available)
      const totalStaked =
        userGraphQLData?.user?.totalNFTsStaked !== undefined
          ? userGraphQLData.user.totalNFTsStaked
          : mergedNftData.filter((nft) => nft.status === "staked").length;

      const totalOwned =
        userGraphQLData?.user?.totalNFTsOwned !== undefined
          ? userGraphQLData.user.totalNFTsOwned
          : totalStaked + tokenIds.length; // staked + unstaked = total owned

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

      console.log("Setting Dashboad Data, current totalOwned: ", totalOwned);

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

        // Check if tokens can be unstaked
        for (const tokenId of tokenIds) {
          const stakingInfo = await contractWithSigner.getStakingInfo(tokenId);
          const [, stakingSince] = stakingInfo;
          const minimumPeriod =
            await contractWithSigner.getMinimumStakingPeriod();

          if (
            Date.now() / 1000 <
            Number(stakingSince) + Number(minimumPeriod)
          ) {
            throw new Error(
              `Token #${tokenId} hasn't reached minimum staking period`
            );
          }
        }

        let tx;
        if (tokenIds.length === 1) {
          // Single token unstaking
          tx = await contractWithSigner.unstakeToken(tokenIds[0]);
        } else {
          // Batch unstaking for multiple tokens
          try {
            tx = await contractWithSigner.unstakeMultipleTokens(tokenIds);
          } catch (error: any) {
            console.warn(
              "Batch unstaking failed, falling back to individual unstaking:",
              error
            );

            // Fallback to individual unstaking
            for (const tokenId of tokenIds) {
              const individualTx = await contractWithSigner.unstakeToken(
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
              title: "NFTs Unstaked Successfully! 🎉",
              description: `Successfully unstaked ${tokenIds.length} NFT${
                tokenIds.length > 1 ? "s" : ""
              } individually. Rewards were automatically claimed!`,
            });

            // Refresh both contract and GraphQL data
            await fetchDashboardData();
            setTimeout(() => {
              refetchUserData();
              refetchPlatformData();
            }, 2000);
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
          title: "NFTs Unstaked Successfully! 🎉",
          description: `Successfully unstaked ${tokenIds.length} NFT${
            tokenIds.length > 1 ? "s" : ""
          }. Rewards were automatically claimed!`,
        });

        // Refresh both contract and GraphQL data
        await fetchDashboardData();
        setTimeout(() => {
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        console.error("Unstaking failed:", error);

        let errorMessage = "Unstaking failed";
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

      setTransactionState({
        isLoading: true,
        status: "pending",
        transactionHash: null,
        error: null,
      });

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer);

        // Get tokens to claim for
        const tokensToClaimFor =
          tokenIds ||
          dashboardData.nftData
            .filter((nft) => nft.status === "staked")
            .map((nft) => nft.id);

        if (tokensToClaimFor.length === 0) {
          throw new Error("No staked tokens to claim rewards for");
        }

        let totalClaimed = 0;

        // Use batch claiming if available, otherwise claim individually
        if (tokensToClaimFor.length > 1) {
          try {
            // Try batch claiming first
            const tx = await (contractWithSigner as any).claimMultipleRewards(
              tokensToClaimFor
            );
            await tx.wait();
            totalClaimed = tokensToClaimFor.length;

            setTransactionState((prev) => ({
              ...prev,
              transactionHash: tx.hash,
            }));
          } catch (error) {
            console.warn(
              "Batch claiming failed, trying individual claims:",
              error
            );

            // Fall back to individual claims
            for (const tokenId of tokensToClaimFor) {
              try {
                const tx = await (contractWithSigner as any).claimReward(
                  tokenId
                );
                await tx.wait();
                totalClaimed++;

                setTransactionState((prev) => ({
                  ...prev,
                  transactionHash: tx.hash,
                }));
              } catch (error: any) {
                console.warn(
                  `Failed to claim for token ${tokenId}:`,
                  error.reason || error.message
                );
              }
            }
          }
        } else {
          // Single token claim
          const tx = await (contractWithSigner as any).claimReward(
            tokensToClaimFor[0]
          );
          await tx.wait();
          totalClaimed = 1;

          setTransactionState((prev) => ({
            ...prev,
            transactionHash: tx.hash,
          }));
        }

        setTransactionState({
          isLoading: false,
          status: "success",
          transactionHash: null,
          error: null,
        });

        toast({
          title: "Rewards Claimed Successfully! 🎉",
          description: `Successfully claimed rewards for ${totalClaimed} NFT${
            totalClaimed > 1 ? "s" : ""
          }`,
        });

        // Refresh both contract and GraphQL data
        await fetchDashboardData();
        setTimeout(() => {
          refetchUserData();
          refetchPlatformData();
        }, 2000);
      } catch (error: any) {
        console.error("Claiming failed:", error);

        let errorMessage = "Claiming failed";
        if (error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected by user";
        } else if (error.reason) {
          errorMessage = error.reason;
        }

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
    isLoading: dashboardData.isLoading,
    error: dashboardData.error,

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
