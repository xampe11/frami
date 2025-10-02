// Auto-generated contract addresses
// Generated at: 2025-09-30T22:07:16.374Z
// Network: localhost

export const FOUNDER_NFT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as const;
export const FOUNDER_NFT_IMPLEMENTATION = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as const;
export const PLATFORM_REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const;

export const CONTRACT_ADDRESSES = {
  FOUNDER_NFT: FOUNDER_NFT_ADDRESS,
  FOUNDER_NFT_IMPLEMENTATION: FOUNDER_NFT_IMPLEMENTATION,
  PLATFORM_REGISTRY: PLATFORM_REGISTRY_ADDRESS,
} as const;

export const NETWORK = "localhost" as const;
export const CHAIN_ID = 31337 as const;

export type ContractAddresses = typeof CONTRACT_ADDRESSES;
export type SupportedNetwork = typeof NETWORK;
export type SupportedChainId = typeof CHAIN_ID;
