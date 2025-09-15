// hooks/useFounderNFT.ts
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/wallet-context";
import founderNFTAbi from "../contracts/abis/FounderNFT.json";
import { FOUNDER_NFT_ADDRESS, CHAIN_ID } from "../contracts/addresses";

// Contract ABI - Replace with your actual contract ABI
const FOUNDER_NFT_ABI = founderNFTAbi;

interface NFTContractData {
  price: string; // in ETH
  priceWei: bigint;
  totalSupply: number;
  maxSupply: number;
  userBalance: number;
  isLoading: boolean;
  error: string | null;
}

interface MintState {
  isLoading: boolean;
  status: "idle" | "pending" | "success" | "error";
  transactionHash: string | null;
  error: string | null;
}

interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  gasCost: string; // in ETH
}

export const useFounderNFT = () => {
  const { isConnected, address } = useWallet();

  const [contractData, setContractData] = useState<NFTContractData>({
    price: "0",
    priceWei: 0n,
    totalSupply: 0,
    maxSupply: 1000,
    userBalance: 0,
    isLoading: true,
    error: null,
  });

  const [mintState, setMintState] = useState<MintState>({
    isLoading: false,
    status: "idle",
    transactionHash: null,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // NEW: Add read-only provider and contract for public data
  const [readOnlyProvider, setReadOnlyProvider] =
    useState<ethers.JsonRpcProvider | null>(null);
  const [readOnlyContract, setReadOnlyContract] =
    useState<ethers.Contract | null>(null);

  // NEW: Initialize read-only provider (no wallet needed)
  useEffect(() => {
    const initializeReadOnlyProvider = async () => {
      try {
        // Use your local Anvil RPC or replace with your target network RPC
        const rpcUrl = import.meta.env.VITE_RPC_URL; // or process.env.VITE_RPC_URL
        const readProvider = new ethers.JsonRpcProvider(rpcUrl);

        const readContract = new ethers.Contract(
          FOUNDER_NFT_ADDRESS,
          FOUNDER_NFT_ABI,
          readProvider
        );

        console.log("Current contract read:", readContract);

        setReadOnlyProvider(readProvider);
        setReadOnlyContract(readContract);

        console.log("Read-only provider initialized successfully");
      } catch (error) {
        console.error("Failed to initialize read-only provider:", error);
        setContractData((prev) => ({
          ...prev,
          error: "Failed to connect to contract",
          isLoading: false,
        }));
      }
    };

    initializeReadOnlyProvider();
  }, []); // No dependencies - runs once on mount

  // Initialize wallet provider and contract (for transactions)
  useEffect(() => {
    const initializeContract = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum && isConnected) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const network = await web3Provider.getNetwork();

          // Switch to network if needed
          if (Number(network.chainId) !== CHAIN_ID) {
            try {
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
              });
            } catch (switchError: any) {
              // If network doesn't exist, log it

              console.log("Network does not exist");
              /* if (switchError.code === 4902) {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: `0x${CHAIN_ID.toString(16)}`,
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
            } */
            }

            const nftContract = new ethers.Contract(
              FOUNDER_NFT_ADDRESS,
              FOUNDER_NFT_ABI,
              web3Provider
            );

            setProvider(web3Provider);
            setContract(nftContract);
          }
        }
      } catch (error) {
        console.error("Failed to initialize contract:", error);
        setContractData((prev) => ({
          ...prev,
          error: "Failed to connect to contract",
          isLoading: false,
        }));
      }

      initializeContract();
    };
  }, [isConnected]);

  // NEW: Fetch public contract data (no wallet needed)
  const fetchPublicData = useCallback(async () => {
    if (!readOnlyContract) return;

    try {
      setContractData((prev) => ({ ...prev, isLoading: true, error: null }));

      const [price, totalSupply, maxSupply, saleActive] = await Promise.all([
        readOnlyContract.getPrice(),
        readOnlyContract.totalSupply(),
        readOnlyContract.getMaxSupply(),
        readOnlyContract.getSaleStatus(),
      ]);

      console.log("Public data fetched:", {
        price: ethers.formatEther(price),
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        saleActive,
      });

      setContractData((prev) => ({
        ...prev,
        price: ethers.formatEther(price),
        priceWei: price,
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to fetch public contract data:", error);
      setContractData((prev) => ({
        ...prev,
        error: "Failed to fetch contract data",
        isLoading: false,
      }));
    }
  }, [readOnlyContract]);

  // NEW: Fetch user-specific data (requires wallet)
  const fetchUserData = useCallback(async () => {
    if (!contract || !address) return;

    try {
      const userBalance = await contract.balanceOf(address);

      setContractData((prev) => ({
        ...prev,
        userBalance: Number(userBalance),
      }));

      console.log("User data fetched:", {
        userBalance: Number(userBalance),
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, [contract, address]);

  // UPDATED: Fetch public data immediately when read-only contract is ready
  useEffect(() => {
    if (readOnlyContract) {
      fetchPublicData();
    }
  }, [readOnlyContract, fetchPublicData]);

  // UPDATED: Fetch user data only when wallet is connected
  useEffect(() => {
    if (contract && address) {
      fetchUserData();
    }
  }, [contract, address, fetchUserData]);

  // LEGACY: Keep the old fetchContractData for backward compatibility
  const fetchContractData = useCallback(async () => {
    // First fetch public data
    await fetchPublicData();
    // Then fetch user data if wallet is connected
    if (isConnected) {
      await fetchUserData();
    }
  }, [fetchPublicData, fetchUserData, isConnected]);

  // In your useFounderNFT hook, add chain verification
  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        const network = await provider.getNetwork();
        console.log("Current network:", network.chainId);

        // Make sure we're on the expected network
        if (network.chainId !== 31337n) {
          console.warn("Wrong network! Expected 31337, got", network.chainId);
          // Request network switch or show error
        }
      }
    };

    checkNetwork();
  }, [provider]);

  // Estimate gas for minting
  const estimateGas = useCallback(
    async (quantity: number): Promise<GasEstimate | null> => {
      if (!contract || !provider || !address) return null;

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer) as ethers.Contract;
        const totalCost = contractData.priceWei * BigInt(quantity);

        console.log("Gas estimation params:", {
          quantity,
          totalCost: totalCost.toString(),
          from: address,
          to: contract.target,
        });

        // Try different gas estimation methods
        try {
          // Add this debug line to see what functions are available
          console.log(
            "Available functions:",
            Object.keys(contract.interface.fragments)
          );
          // Method 1: Direct estimateGas
          const gasLimit = 400000;
          console.log("Gas estimation successful:", gasLimit.toString());

          const feeData = await provider.getFeeData();
          const gasPrice = feeData.gasPrice || 0n;

          return {
            gasLimit: BigInt(gasLimit),
            gasPrice,
            gasCost: ethers.formatEther(BigInt(gasLimit) * gasPrice),
          };
        } catch (estimateError) {
          console.error("Direct gas estimation failed:", estimateError);

          // Method 2: Try calling the function first to see the actual error
          try {
            await contractWithSigner.mintMultiple.staticCall(quantity, {
              value: totalCost,
            });
            console.log("Static call succeeded - this is weird");
          } catch (staticError) {
            console.error("Static call failed with:", staticError);
          }

          throw estimateError;
        }
      } catch (error) {
        console.error("Gas estimation failed:", error);
        return null;
      }
    },
    [contract, provider, address, contractData.priceWei]
  );

  // Mint function
  const mintMultiple = useCallback(
    async (quantity: number) => {
      if (!contract || !provider || !address) {
        throw new Error("Contract not initialized or wallet not connected");
      }

      setMintState({
        isLoading: true,
        status: "pending",
        transactionHash: null,
        error: null,
      });

      try {
        const signer = await provider.getSigner();
        const contractWithSigner = contract.connect(signer) as ethers.Contract;

        // Calculate total cost
        const totalCost = contractData.priceWei * BigInt(quantity);

        // Estimate gas
        const gasEstimate = 400000;

        if (!gasEstimate) {
          throw new Error("Failed to estimate gas");
        }

        // Send transaction
        const transaction = await contractWithSigner.mintMultiple(quantity, {
          value: totalCost,
        });

        setMintState((prev) => ({
          ...prev,
          transactionHash: transaction.hash,
        }));

        // Wait for confirmation
        const receipt = await transaction.wait();

        setMintState({
          isLoading: false,
          status: "success",
          transactionHash: receipt.hash,
          error: null,
        });

        // Refresh contract data
        await fetchContractData();

        return {
          success: true,
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed.toString(),
        };
      } catch (error: any) {
        console.error("Minting failed:", error);

        let errorMessage = "Transaction failed";

        if (error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected by user";
        } else if (error.code === "INSUFFICIENT_FUNDS") {
          errorMessage = "Insufficient funds for transaction";
        } else if (error.reason) {
          errorMessage = `Transaction reverted: ${error.reason}`;
        } else if (error.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (error.message?.includes("execution reverted")) {
          errorMessage = "Transaction reverted. Check contract conditions.";
        } else if (error.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user";
        }

        setMintState({
          isLoading: false,
          status: "error",
          transactionHash: null,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      }
    },
    [
      contract,
      provider,
      address,
      contractData.priceWei,
      estimateGas,
      fetchContractData,
    ]
  );

  // Calculate total cost including gas
  const calculateTotalCost = useCallback(
    async (quantity: number) => {
      const mintCost = parseFloat(contractData.price) * quantity;
      const gasEstimate = await estimateGas(quantity);
      const gasCost = gasEstimate ? parseFloat(gasEstimate.gasCost) : 0.005; // fallback

      return {
        mintCost,
        gasCost,
        total: mintCost + gasCost,
      };
    },
    [contractData.price, estimateGas]
  );

  // Reset mintMultiple state
  const resetMintState = useCallback(() => {
    setMintState({
      isLoading: false,
      status: "idle",
      transactionHash: null,
      error: null,
    });
  }, []);

  // Listen to contract events
  useEffect(() => {
    if (!contract) return;

    const handleTransfer = (from: string, to: string, tokenId: bigint) => {
      if (to.toLowerCase() === address?.toLowerCase()) {
        console.log("NFT received:", tokenId.toString());
        // Refresh data when user receives an NFT
        fetchContractData();
      }
    };

    const handleMint = (to: string, quantity: bigint, totalPaid: bigint) => {
      if (to.toLowerCase() === address?.toLowerCase()) {
        console.log("Mint successful:", {
          quantity: quantity.toString(),
          totalPaid: ethers.formatEther(totalPaid),
        });
      }
    };

    // Event listeners
    contract.on("Transfer", handleTransfer);
    contract.on("FounderNFTMinted", handleMint);

    return () => {
      contract.off("Transfer", handleTransfer);
      contract.off("FounderNFTMinted", handleMint);
    };
  }, [contract, address, fetchContractData]);

  return {
    // Contract data
    ...contractData,

    // Mint functionality
    mintMultiple,
    mintState,
    resetMintState,

    // Utilities
    estimateGas,
    calculateTotalCost,
    refreshData: fetchContractData,

    // Connection status
    isContractReady: !!contract && !!provider,
    isPublicDataReady: !!readOnlyContract, // NEW: For checking if public data is available
    provider,
    contract,
    readOnlyProvider, // NEW: Expose read-only provider
    readOnlyContract, // NEW: Expose read-only contract
  };
};
