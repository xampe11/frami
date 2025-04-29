import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Get WalletConnect projectId from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.warn("VITE_WALLET_CONNECT_PROJECT_ID not found. WalletConnect functionality may be limited.");
}

// Configure the Wagmi config with RainbowKit's getDefaultConfig helper
export const config = getDefaultConfig({
  appName: 'Real World Projects',
  projectId: projectId as string,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Helper function to shorten wallet addresses
export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
