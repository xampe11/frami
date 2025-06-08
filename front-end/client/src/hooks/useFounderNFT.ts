// hooks/useFounderNFT.ts
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/wallet-context";
import { contractConfig } from "../contracts/config";

// Contract ABI - Replace with your actual contract ABI
const FOUNDER_NFT_ABI = contractConfig.contracts.FounderNFT.abi;

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

  // Initialize provider and contract
  useEffect(() => {
    const initializeContract = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum && isConnected) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const network = await web3Provider.getNetwork();

          // Switch to Anvil network if needed
          if (Number(network.chainId) !== contractConfig.chainId) {
            try {
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [
                  { chainId: `0x${contractConfig.chainId.toString(16)}` },
                ],
              });
            } catch (switchError: any) {
              // If network doesn't exist, add it
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

          const nftContract = new ethers.Contract(
            contractConfig.contracts.FounderNFT.address,
            FOUNDER_NFT_ABI,
            web3Provider
          );

          setProvider(web3Provider);
          setContract(nftContract);
        }
      } catch (error) {
        console.error("Failed to initialize contract:", error);
        setContractData((prev) => ({
          ...prev,
          error: "Failed to connect to contract",
          isLoading: false,
        }));
      }
    };

    initializeContract();
  }, [isConnected]);

  // Fetch contract data
  const fetchContractData = useCallback(async () => {
    if (!contract || !address) return;

    try {
      setContractData((prev) => ({ ...prev, isLoading: true, error: null }));

      const [price, totalSupply, maxSupply, userBalance, saleActive] =
        await Promise.all([
          contract.getPrice(),
          contract.totalSupply(),
          contract.getMaxSupply(),
          contract.balanceOf(address),
          contract.getSaleStatus(),
        ]);

      console.log({
        price: ethers.formatEther(price),
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        saleActive, // Check if minting is enabled
      });

      setContractData({
        price: ethers.formatEther(price),
        priceWei: price,
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        userBalance: Number(userBalance),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      setContractData((prev) => ({
        ...prev,
        error: "Failed to fetch contract data",
        isLoading: false,
      }));
    }
  }, [contract, address]);

  // Fetch data when contract is ready
  useEffect(() => {
    if (contract && address) {
      fetchContractData();
    }
  }, [contract, address, fetchContractData]);

  // Estimate gas for minting
  /*   const estimateGas = useCallback(
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
          const gasLimit = await (
            contractWithSigner as any
          ).estimateGas.mintMultiple(quantity, {
            value: totalCost,
          });
          console.log("Gas estimation successful:", gasLimit.toString());

          const feeData = await provider.getFeeData();
          const gasPrice = feeData.gasPrice || 0n;

          return {
            gasLimit: (gasLimit * 120n) / 100n,
            gasPrice,
            gasCost: ethers.formatEther(gasLimit * gasPrice),
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
  ); */
  // Add this debug function to your useFounderNFT hook

  const debugMintMultiple = async (quantity: number) => {
    if (!contract || !provider || !address) {
      throw new Error("Contract not initialized or wallet not connected");
    }
    try {
      const signer = await provider.getSigner();
      console.log("=== DEBUGGING MINT MULTIPLE ===");
      console.log("Quantity requested:", quantity);

      // 1. Check if contract is connected
      const contractAddress = await contract.getAddress();
      const signerAddress = await signer.getAddress();
      console.log("Contract address:", contractAddress);
      console.log("Signer address:", signerAddress);

      // 2. Check basic contract state
      console.log("\n--- Contract State ---");

      // Check if functions exist and work
      try {
        const saleActive = await contract.getSaleStatus();
        console.log("Sale active:", saleActive);

        if (!saleActive) {
          console.error("❌ ISSUE FOUND: Sale is not active!");
          return { error: "Sale not active" };
        }
      } catch (error: any) {
        console.error("❌ getSaleStatus() failed:", error.message);
        return { error: "Cannot check sale status" };
      }

      try {
        const currentSupply = await contract.totalSupply();
        const maxSupply = await contract.getMaxSupply();
        console.log("Current supply:", currentSupply.toString());
        console.log("Max supply:", maxSupply.toString());

        if (currentSupply + BigInt(quantity) > maxSupply) {
          console.error("❌ ISSUE FOUND: Would exceed max supply!");
          return { error: "Exceeds max supply" };
        }
      } catch (error: any) {
        console.error("❌ Supply check failed:", error.message);
        return { error: "Cannot check supply" };
      }

      // 3. Check pricing and payment
      console.log("\n--- Payment Check ---");
      try {
        const price = await contract.getPrice();
        const totalCost = price * BigInt(quantity);
        const userBalance = await signer.provider.getBalance(signerAddress);

        console.log("NFT price:", ethers.formatEther(price), "ETH");
        console.log(
          "Total cost for",
          quantity,
          "NFTs:",
          ethers.formatEther(totalCost),
          "ETH"
        );
        console.log("User balance:", ethers.formatEther(userBalance), "ETH");

        if (userBalance < totalCost) {
          console.error("❌ ISSUE FOUND: Insufficient balance!");
          return { error: "Insufficient balance" };
        }
      } catch (error: any) {
        console.error("❌ Payment check failed:", error.message);
        return { error: "Cannot check payment requirements" };
      }

      // 4. Check if mintMultiple function exists
      console.log("\n--- Function Check ---");
      try {
        const fragment = contract.interface.getFunction("mintMultiple");
        if (fragment) {
          console.log("✅ mintMultiple function found:", fragment.name);
        } else {
          throw new Error("Function not found");
        }
      } catch (error) {
        console.error("❌ ISSUE FOUND: mintMultiple function not found!");
        console.log(
          "Available functions:",
          contract.interface.fragments
            .filter((f) => f.type === "function")
            .forEach((f) => {
              const funcFragment = f as ethers.FunctionFragment;
              console.log(" -", funcFragment.name);
            })
        );
        return { error: "mintMultiple function does not exist" };
      }

      // 5. Try calling mintMultiple with quantity 1 first
      console.log("\n--- Gas Estimation Test ---");
      try {
        const price = await contract.getPrice();
        console.log("Testing gas estimation for quantity 1...");

        const gasEstimate = await contract.mintMultiple.estimateGas(1, {
          value: price,
        });
        console.log("✅ Gas estimate for 1 NFT:", gasEstimate.toString());

        // Now try the requested quantity
        console.log(`Testing gas estimation for quantity ${quantity}...`);
        const gasEstimateMultiple = await contract.mintMultiple.estimateGas(
          quantity,
          {
            value: price * BigInt(quantity),
          }
        );
        console.log(
          `✅ Gas estimate for ${quantity} NFTs:`,
          gasEstimateMultiple.toString()
        );

        return { success: true, gasEstimate: gasEstimateMultiple };
      } catch (error: any) {
        console.error("❌ ISSUE FOUND: Gas estimation failed!");
        console.error("Error details:", error.message);

        // Try to get more specific error info
        if (error.message.includes("require(false)")) {
          console.log(
            "This suggests a require() statement is failing in the contract"
          );
        }

        return { error: "Gas estimation failed: " + error.message };
      }
    } catch (error: any) {
      console.error("❌ Debug failed:", error);
      return { error: "Debug failed: " + error.message };
    }
  };

  // Call this before attempting to mint
  // const debugResult = await debugMintMultiple(3);
  // console.log('Debug result:', debugResult);

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
        //const gasEstimate = await estimateGas(quantity);

        /*         if (!gasEstimate) {
          throw new Error("Failed to estimate gas");
        } */

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
      //estimateGas,
      fetchContractData,
    ]
  );

  // Calculate total cost including gas
  /*   const calculateTotalCost = useCallback(
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
  ); */

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

    // Debugging Function
    debugMintMultiple,

    // Utilities
    //estimateGas,
    //calculateTotalCost,
    refreshData: fetchContractData,

    // Connection status
    isContractReady: !!contract && !!provider,
    provider,
    contract,
  };
};
