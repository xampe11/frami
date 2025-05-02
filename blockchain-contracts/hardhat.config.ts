import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
// Optionally add verification
import "@nomicfoundation/hardhat-verify";
// Add TypeScript support
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

// Load environment variables if present
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // Use same directory structure as Foundry for compatibility
  paths: {
    sources: "./src",
    tests: "./test-hardhat", // Keep Hardhat tests separate
    cache: "./cache-hardhat",
    artifacts: "./artifacts-hardhat",
  },
  networks: {
    // For local development
    hardhat: {
      chainId: 31337,
    },
    // Add other networks as needed
    // Example:
    // sepolia: {
    //   url: process.env.SEPOLIA_URL || "",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  // If using verification
  etherscan: {
    apiKey: {
      // For example:
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      // Add other network API keys as needed
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
};

export default config;
