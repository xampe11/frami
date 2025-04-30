import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    sources: "./src", // Foundry's contracts directory
    tests: "./hardhat-tests", // Separate Hardhat tests if needed
    artifacts: "./artifacts", // Shared artifacts
  },
};

export default config;
