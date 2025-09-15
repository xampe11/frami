// Auto-generated contract types
// Generated at: 2025-09-13T22:29:16.725Z
// Network: localhost

export interface ContractAddresses {
  FOUNDER_NFT: string;
  FOUNDER_NFT_IMPLEMENTATION: string;
  PLATFORM_REGISTRY: string;
  PLATFORM_REGISTRY_IMPLEMENTATION: string;
}

export interface DeploymentInfo {
  network: string;
  chainId: number;
  timestamp: number;
}

export const NETWORK = "Sepolia" as const;
export const CHAIN_ID = 11155111 as const;

export type SupportedNetwork = "Sepolia";
export type SupportedChainId = 11155111;

export const CONTRACT_ADDRESSES: ContractAddresses = {
  FOUNDER_NFT: "0xA901abB036523D1f7618a0521C1b4749FCd80a3b",
  FOUNDER_NFT_IMPLEMENTATION: "0xF721dE96A74Fbd6C3cB930fb2e31384287ff0282",
  PLATFORM_REGISTRY: "0xE47C9763d98364fdf496AF5d3d80B53169114440",
  PLATFORM_REGISTRY_IMPLEMENTATION:
    "0xD714f2a03129f77ee76a28A56d52253226E753f7",
};

export const DEPLOYMENT_INFO: DeploymentInfo = {
  network: "Sepolia",
  chainId: 11155111,
  timestamp: 1756591727,
};
