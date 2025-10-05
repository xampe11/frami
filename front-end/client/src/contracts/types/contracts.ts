// Auto-generated contract types
// Generated at: 2025-10-05T19:28:32.628Z
// Network: localhost

export interface ContractAddresses {
  FOUNDER_NFT: string;
  FOUNDER_NFT_IMPLEMENTATION: string;
  PLATFORM_REGISTRY: string;
}

export interface DeploymentInfo {
  network: string;
  chainId: number;
  deploymentBlock: number;
  deploymentTimestamp: number;
}

export const NETWORK = "localhost" as const;
export const CHAIN_ID = 31337 as const;

export type SupportedNetwork = "localhost";
export type SupportedChainId = 31337;

export const CONTRACT_ADDRESSES: ContractAddresses = {
  FOUNDER_NFT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  FOUNDER_NFT_IMPLEMENTATION: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  PLATFORM_REGISTRY: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
};

export const DEPLOYMENT_INFO: DeploymentInfo = {
  network: "localhost",
  chainId: 31337,
  deploymentBlock: 0,
  deploymentTimestamp: 1759691564
};
