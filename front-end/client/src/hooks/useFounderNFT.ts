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
        const rpcUrl = import.meta.env.VITE_RPC_URL;

        if (!rpcUrl) {
          throw new Error("VITE_RPC_URL environment variable not set");
        }

        console.log("Initializing read-only provider with RPC:", rpcUrl);
        console.log("Contract address:", FOUNDER_NFT_ADDRESS);
        console.log("Expected chain ID:", CHAIN_ID);

        const readProvider = new ethers.JsonRpcProvider(rpcUrl);

        // Test the connection
        const network = await readProvider.getNetwork();
        console.log("Connected to network:", {
          chainId: network.chainId.toString(),
          name: network.name,
        });

        const readContract = new ethers.Contract(
          FOUNDER_NFT_ADDRESS,
          FOUNDER_NFT_ABI,
          readProvider
        );

        console.log("Read-only contract created:", readContract.target);

        setReadOnlyProvider(readProvider);
        setReadOnlyContract(readContract);

        console.log("Read-only provider initialized successfully");
      } catch (error) {
        console.error("Failed to initialize read-only provider:", error);
        setContractData((prev) => ({
          ...prev,
          error: `Failed to connect to contract: ${error}`,
          isLoading: false,
        }));
      }
    };

    initializeReadOnlyProvider();
  }, []);

  // Initialize wallet provider and contract (for transactions)
  useEffect(() => {
    const initializeContract = async () => {
      if (!isConnected || typeof window === "undefined" || !window.ethereum) {
        return;
      }

      try {
        console.log("Initializing wallet contract...");
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const network = await web3Provider.getNetwork();

        console.log("Wallet network:", {
          chainId: network.chainId.toString(),
          expected: CHAIN_ID.toString(),
        });

        // Switch to network if needed
        if (Number(network.chainId) !== CHAIN_ID) {
          console.log("Wrong network, attempting to switch...");
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
            });

            // Re-get network after switch
            const newNetwork = await web3Provider.getNetwork();
            console.log("Switched to network:", newNetwork.chainId.toString());
          } catch (switchError: any) {
            console.log("Network switch failed:", switchError);
            setContractData((prev) => ({
              ...prev,
              error: `Please switch to the correct network (Chain ID: ${CHAIN_ID})`,
            }));
            return;
          }
        }

        const nftContract = new ethers.Contract(
          FOUNDER_NFT_ADDRESS,
          FOUNDER_NFT_ABI,
          web3Provider
        );

        console.log("Wallet contract created:", nftContract.target);

        setProvider(web3Provider);
        setContract(nftContract);
      } catch (error) {
        console.error("Failed to initialize wallet contract:", error);
        setContractData((prev) => ({
          ...prev,
          error: `Failed to connect wallet contract: ${error}`,
        }));
      }
    };

    initializeContract();
  }, [isConnected]);

  // NEW: Fetch public contract data (no wallet needed)
  const fetchPublicData = useCallback(async () => {
    if (!readOnlyContract) {
      console.log("No read-only contract available for fetchPublicData");
      return;
    }

    try {
      console.log("Fetching public contract data...");
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

      if (!saleActive) {
        console.warn(
          "⚠️ NFT sale is not active! Contact admin to activate sales."
        );
      }

      setContractData((prev) => ({
        ...prev,
        price: ethers.formatEther(price),
        priceWei: price,
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        isLoading: false,
        error: saleActive ? null : "NFT sale is currently inactive",
      }));
    } catch (error) {
      console.error("Failed to fetch public contract data:", error);
      setContractData((prev) => ({
        ...prev,
        error: `Failed to fetch contract data: ${error}`,
        isLoading: false,
      }));
    }
  }, [readOnlyContract]);

  // NEW: Fetch user-specific data (requires wallet)
  const fetchUserData = useCallback(async () => {
    if (!contract || !address) return;

    try {
      console.log("Fetching user data for:", address);
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
    if (isConnected && contract && address) {
      await fetchUserData();
    }
  }, [fetchPublicData, fetchUserData, isConnected, contract, address]);

  // FIXED: Network verification
  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        const network = await provider.getNetwork();
        console.log("Current wallet network:", network.chainId.toString());

        // Make sure we're on the expected network
        if (Number(network.chainId) !== CHAIN_ID) {
          console.warn(
            `Wrong network! Expected ${CHAIN_ID}, got ${network.chainId}`
          );
        } else {
          console.log("✅ Wallet connected to correct network");
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

        // Use a reasonable gas estimate for NFT minting
        const gasLimit = BigInt(200000 + quantity * 100000); // Base gas + per-NFT gas

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || BigInt("20000000000"); // 20 gwei fallback

        console.log("Gas estimation successful:", {
          gasLimit: gasLimit.toString(),
          gasPrice: gasPrice.toString(),
          gasCost: ethers.formatEther(gasLimit * gasPrice),
        });

        return {
          gasLimit,
          gasPrice,
          gasCost: ethers.formatEther(gasLimit * gasPrice),
        };
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

      // Validate quantity range
      if (quantity < 1 || quantity > 5) {
        const errorMessage = "Quantity must be between 1 and 5 NFTs";
        setMintState({
          isLoading: false,
          status: "error",
          transactionHash: null,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      console.log("Starting mint process:", {
        quantity,
        price: contractData.price,
        totalCost: ethers.formatEther(contractData.priceWei * BigInt(quantity)),
      });

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

        const saleActiveCheck = await contract.getSaleStatus();

        // Pre-flight checks before sending transaction
        console.log("Pre-flight checks:", {
          saleActive: saleActiveCheck,
          userAddress: address,
          totalSupply: contractData.totalSupply,
          maxSupply: contractData.maxSupply,
          remainingSupply: contractData.maxSupply - contractData.totalSupply,
        });

        // Check if sale is active
        if (!saleActiveCheck) {
          throw new Error("Sale is not active");
        }

        // Check if enough supply remains
        if (contractData.totalSupply + quantity > contractData.maxSupply) {
          throw new Error(
            `Not enough NFTs remaining. Only ${
              contractData.maxSupply - contractData.totalSupply
            } left.`
          );
        }

        // Check user's balance
        const balance = await provider.getBalance(address);
        console.log("User balance:", ethers.formatEther(balance), "ETH");
        console.log("Required amount:", ethers.formatEther(totalCost), "ETH");

        if (balance < totalCost) {
          throw new Error(
            `Insufficient funds. You need ${ethers.formatEther(
              totalCost
            )} ETH but only have ${ethers.formatEther(balance)} ETH`
          );
        }

        // Estimate gas before sending
        try {
          const estimatedGas =
            await contractWithSigner.mintMultiple.estimateGas(quantity, {
              value: totalCost,
            });
          console.log("Estimated gas:", estimatedGas.toString());
        } catch (gasError: any) {
          console.error("Gas estimation failed:", gasError);

          // Try to extract the revert reason
          let revertReason = "Unknown error";
          if (gasError.reason) {
            revertReason = gasError.reason;
          } else if (gasError.data) {
            try {
              // Try to decode the error
              const errorData = gasError.data;
              if (typeof errorData === "string" && errorData.startsWith("0x")) {
                // Custom error or revert string
                revertReason = `Contract error: ${errorData}`;
              }
            } catch (e) {
              console.error("Could not decode error:", e);
            }
          } else if (gasError.message) {
            revertReason = gasError.message;
          }

          throw new Error(`Transaction will fail: ${revertReason}`);
        }

        console.log("Sending mint transaction:", {
          function: "mintMultiple",
          quantity,
          value: ethers.formatEther(totalCost) + " ETH",
        });

        // Send transaction
        const transaction = await contractWithSigner.mintMultiple(quantity, {
          value: totalCost,
          gasLimit: BigInt(200000 + quantity * 100000), // Dynamic gas limit
        });

        console.log("Transaction sent:", transaction.hash);

        setMintState((prev) => ({
          ...prev,
          transactionHash: transaction.hash,
        }));

        // Wait for confirmation
        console.log("Waiting for transaction confirmation...");
        const receipt = await transaction.wait();

        console.log("Transaction confirmed:", {
          hash: receipt.hash,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
          blockNumber: receipt.blockNumber,
        });

        setMintState({
          isLoading: false,
          status: "success",
          transactionHash: receipt.hash,
          error: null,
        });

        // Add delay before refreshing to allow blockchain to sync
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Refresh contract data
        await fetchContractData();

        return {
          success: true,
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed.toString(),
        };
      } catch (error: any) {
        console.error("Minting failed:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          reason: error.reason,
          data: error.data,
        });

        let errorMessage = "Transaction failed";

        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.code === "INSUFFICIENT_FUNDS") {
          errorMessage = "Insufficient funds for transaction";
        } else if (error.message?.includes("Insufficient funds")) {
          errorMessage = error.message;
        } else if (error.message?.includes("Not enough NFTs remaining")) {
          errorMessage = error.message;
        } else if (error.message?.includes("Sale is not active")) {
          errorMessage = "NFT sale is currently not active";
        } else if (error.message?.includes("Transaction will fail")) {
          errorMessage = error.message;
        } else if (error.reason) {
          errorMessage = `Transaction reverted: ${error.reason}`;
        } else if (error.message?.includes("execution reverted")) {
          errorMessage = "Transaction reverted. Check contract conditions.";
        } else if (error.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (error.code === -32603) {
          errorMessage =
            "RPC error. Please check your network connection and try again.";
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
      contractData.price,
      contractData.totalSupply,
      contractData.maxSupply,
      fetchContractData,
    ]
  );

  // Calculate total cost including gas
  const calculateTotalCost = useCallback(
    async (quantity: number) => {
      const mintCost = parseFloat(contractData.price) * quantity;
      const gasEstimate = await estimateGas(quantity);
      const gasCost = gasEstimate ? parseFloat(gasEstimate.gasCost) : 0.01; // Realistic fallback

      return {
        mintCost,
        gasCost,
        total: mintCost + gasCost,
      };
    },
    [contractData.price, estimateGas]
  );

  // Reset mint state
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
    isPublicDataReady: !!readOnlyContract && !contractData.isLoading, // FIXED: Check loading state
    provider,
    contract,
    readOnlyProvider,
    readOnlyContract,
  };
};
