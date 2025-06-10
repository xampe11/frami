import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/wallet-context";
import { contractConfig } from "../contracts/config";
import { useToast } from "@/hooks/use-toast";

const FOUNDER_NFT_ABI = contractConfig.contracts.FounderNFT.abi;

interface NFTData {
  id: number;
  tokenId: string;
  status: "staked" | "unstaked";
  stakingDuration: string;
  earnedRewards: string;
  nextUnstakeDate: string | null;
  canUnstake: boolean;
  stakingSince?: number;
  realtimeEarnings?: string; // New: real-time calculated earnings
}

interface StakingData {
  totalStaked: number;
  totalOwned: number;
  currentAPY: number; // Now calculated from actual APR
  totalRewards: string;
  minimumStakingPeriod: number;
  currentRewardRate: string; // New: ETH per second rate
  estimatedAPR: number; // New: real APR from contract
  totalStakedGlobally: number; // New: total staked in entire system
}

interface EarningsData {
  totalEarnings: string;
  platformFees: string;
  daoTokens: string;
  claimableAmount: string;
  realtimeClaimable: string; // New: real-time claimable amount
}

// Removed WeeklyReward interface - no longer needed with continuous system

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

  // Initialize read-only provider for public data
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

  // Initialize wallet provider when connected
  useEffect(() => {
    const initializeWalletProvider = async () => {
      if (!isConnected || typeof window === "undefined" || !window.ethereum)
        return;

      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const network = await web3Provider.getNetwork();

        // Switch to correct network if needed
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

  // Get user's NFT token IDs
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

  // Calculate staking duration in days
  const calculateStakingDuration = (stakingSince: number): string => {
    if (stakingSince === 0) return "0 days";
    const now = Math.floor(Date.now() / 1000);
    const duration = Math.floor((now - stakingSince) / (24 * 60 * 60));
    return `${duration} days`;
  };

  // Format timestamp to date string
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString().split("T")[0];
  };

  // Real-time earnings calculation (for UI updates)
  const calculateRealtimeEarnings = useCallback(
    async (tokenId: number, baseEarnings: string): Promise<string> => {
      if (!readOnlyContract) return baseEarnings;

      try {
        // Get current earned amount (includes real-time accrual)
        const currentEarned = await readOnlyContract.earned(tokenId);
        return ethers.formatEther(currentEarned);
      } catch (error) {
        console.warn("Failed to get real-time earnings:", error);
        return baseEarnings;
      }
    },
    [readOnlyContract]
  );

  // Fetch all user dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!contract || !address || !readOnlyContract) return;

    try {
      setDashboardData((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get user's token IDs
      const tokenIds = await getUserTokenIds(contract);

      if (tokenIds.length === 0) {
        setDashboardData((prev) => ({
          ...prev,
          nftData: [],
          stakingData: { ...prev.stakingData, totalOwned: 0, totalStaked: 0 },
          isLoading: false,
        }));
        return;
      }

      // Get contract data using NEW functions
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

      // Process each NFT
      const nftDataPromises = tokenIds.map(
        async (tokenId): Promise<NFTData> => {
          const [isStaked, stakingInfo] = await Promise.all([
            contract.isTokenStaked(tokenId),
            contract.getStakingInfo(tokenId),
          ]);

          const [owner, stakingSince] = stakingInfo;

          // Get earned rewards using NEW function
          let earnedAmount = "0";
          let realtimeAmount = "0";

          if (isStaked) {
            try {
              // Use the new earned() function for real-time calculation
              const earned = await readOnlyContract.earned(tokenId);
              earnedAmount = ethers.formatEther(earned);
              realtimeAmount = earnedAmount; // Same for now, but can be updated more frequently
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

      const nftData = await Promise.all(nftDataPromises);

      // Calculate totals
      const totalStaked = nftData.filter(
        (nft) => nft.status === "staked"
      ).length;

      const totalEarnings = nftData.reduce((sum, nft) => {
        return sum + parseFloat(nft.earnedRewards.replace(" ETH", ""));
      }, 0);

      setDashboardData((prev) => ({
        ...prev,
        nftData,
        stakingData: {
          ...prev.stakingData,
          totalOwned: tokenIds.length,
          totalStaked,
          totalRewards: `${totalEarnings.toFixed(6)} ETH`,
          minimumStakingPeriod: Math.floor(
            Number(minimumStakingPeriod) / (24 * 60 * 60)
          ), // Convert to days
          currentRewardRate: `${ethers.formatEther(currentRewardRate)} ETH/sec`,
          estimatedAPR: Number(estimatedAPR) / 100, // Convert from basis points to percentage
          currentAPY: Number(estimatedAPR) / 100, // Use estimated APR as APY approximation
          totalStakedGlobally: Number(totalStakedSupply),
        },
        earningsData: {
          ...prev.earningsData,
          totalEarnings: `${totalEarnings.toFixed(6)} ETH`,
          claimableAmount: `${totalEarnings.toFixed(6)} ETH`,
          realtimeClaimable: `${totalEarnings.toFixed(6)} ETH`,
        },
        isLoading: false,
      }));

      console.log("Dashboard data fetched:", {
        tokenIds,
        totalStaked,
        totalEarnings,
        globalStaked: Number(totalStakedSupply),
        rewardRate: ethers.formatEther(currentRewardRate),
        estimatedAPR: Number(estimatedAPR) / 100,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        error: "Failed to fetch dashboard data",
        isLoading: false,
      }));
    }
  }, [contract, address, readOnlyContract, getUserTokenIds]);

  // Fetch data when contract is ready
  useEffect(() => {
    if (contract && address && readOnlyContract) {
      fetchDashboardData();
    }
  }, [contract, address, readOnlyContract, fetchDashboardData]);

  // Auto-refresh when transaction succeeds
  useEffect(() => {
    if (transactionState.status === "success") {
      // Small delay to ensure blockchain state is properly updated
      const refreshTimer = setTimeout(() => {
        fetchDashboardData();
      }, 2000); // 2 second delay

      return () => clearTimeout(refreshTimer);
    }
  }, [transactionState.status, fetchDashboardData]);

  // Real-time updates for earnings (optional - runs every 30 seconds)
  useEffect(() => {
    if (!readOnlyContract || !dashboardData.nftData.length) return;

    const updateRealtimeEarnings = async () => {
      try {
        const updatedNftData = await Promise.all(
          dashboardData.nftData.map(async (nft) => {
            if (nft.status === "staked") {
              try {
                const earned = await readOnlyContract.earned(nft.id);
                const realtimeAmount = parseFloat(ethers.formatEther(earned));
                return {
                  ...nft,
                  realtimeEarnings: `${realtimeAmount.toFixed(6)} ETH`,
                };
              } catch (error) {
                return nft; // Keep original if update fails
              }
            }
            return nft;
          })
        );

        // Calculate new total
        const newTotalEarnings = updatedNftData.reduce((sum, nft) => {
          return (
            sum +
            parseFloat(
              (nft.realtimeEarnings || nft.earnedRewards).replace(" ETH", "")
            )
          );
        }, 0);

        setDashboardData((prev) => ({
          ...prev,
          nftData: updatedNftData,
          stakingData: {
            ...prev.stakingData,
            totalRewards: `${newTotalEarnings.toFixed(6)} ETH`,
          },
          earningsData: {
            ...prev.earningsData,
            realtimeClaimable: `${newTotalEarnings.toFixed(6)} ETH`,
          },
        }));
      } catch (error) {
        console.warn("Failed to update real-time earnings:", error);
      }
    };

    // Update every 30 seconds
    const interval = setInterval(updateRealtimeEarnings, 30000);
    return () => clearInterval(interval);
  }, [readOnlyContract, dashboardData.nftData.length]);

  // Stake multiple NFTs
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
          // Single token staking
          tx = await (contractWithSigner as any).stakeToken(tokenIds[0]);
        } else {
          // Batch staking for multiple tokens
          try {
            tx = await (contractWithSigner as any).stakeMultipleTokens(
              tokenIds
            );
          } catch (error: any) {
            console.warn(
              "Batch staking failed, falling back to individual staking:",
              error
            );

            // Fallback to individual staking
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

            // ✅ FIXED: Refresh data immediately after success
            await fetchDashboardData();
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

        // ✅ FIXED: Refresh data immediately after success
        await fetchDashboardData();
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
    [contract, provider, toast, fetchDashboardData]
  );

  // Unstake multiple NFTs
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

        // Check if tokens can be unstaked
        for (const tokenId of tokenIds) {
          const stakingInfo = await (contractWithSigner as any).getStakingInfo(
            tokenId
          );
          const [, stakingSince] = stakingInfo;
          const minimumPeriod = await (
            contractWithSigner as any
          ).getMinimumStakingPeriod();

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
          tx = await (contractWithSigner as any).unstakeToken(tokenIds[0]);
        } else {
          // Batch unstaking for multiple tokens
          try {
            tx = await (contractWithSigner as any).unstakeMultipleTokens(
              tokenIds
            );
          } catch (error: any) {
            console.warn(
              "Batch unstaking failed, falling back to individual unstaking:",
              error
            );

            // Fallback to individual unstaking
            for (const tokenId of tokenIds) {
              const individualTx = await (
                contractWithSigner as any
              ).unstakeToken(tokenId);
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

            // ✅ FIXED: Refresh data immediately after success
            await fetchDashboardData();
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

        // ✅ FIXED: Refresh data immediately after success
        await fetchDashboardData();
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
    [contract, provider, toast, fetchDashboardData]
  );

  // Claim rewards for specific tokens
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

        // ✅ FIXED: Refresh data immediately after success
        await fetchDashboardData();
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
    [contract, provider, dashboardData.nftData, toast, fetchDashboardData]
  );

  // Convenience function for claiming all rewards
  const claimAllRewards = useCallback(async () => {
    return claimRewards(); // Will claim for all staked tokens
  }, [claimRewards]);

  // Reset transaction state
  const resetTransactionState = useCallback(() => {
    setTransactionState({
      isLoading: false,
      status: "idle",
      transactionHash: null,
      error: null,
    });
  }, []);

  return {
    // Data
    ...dashboardData,

    // Transaction state
    transactionState,

    // Actions
    stakeNFTs,
    unstakeNFTs,
    claimRewards, // New: more flexible claiming
    claimAllRewards, // Updated: uses new claiming system
    refreshData: fetchDashboardData,
    resetTransactionState,

    // Status
    isContractReady: !!contract && !!provider,
    isReadOnlyReady: !!readOnlyContract,
  };
};
