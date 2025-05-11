import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi";
import { mainnet, sepolia } from "wagmi/chains";

// 1. Define constants - using environment variable
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string;

// 2. Create wagmiConfig
const metadata = {
  name: "Frami",
  description: "A blockchain-powered crowdfunding platform",
  url: window.location.origin,
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Ensure chains are properly defined as a const array
const chains = [mainnet, sepolia] as const;

// Create Wagmi config
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// 3. Create modal
export const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#7857FF",
    "--w3m-font-family": "Inter, sans-serif",
    "--w3m-border-radius-master": "8px",
  },
});

export { wagmiConfig };
