import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Web3Modal Configuration - directly in main.tsx to ensure initialization before rendering
// Use VITE_ prefix for environment variables in Vite
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string;

// Fallback to using a default for testing if not set
if (!projectId) {
  console.warn('VITE_WALLET_CONNECT_PROJECT_ID environment variable not set - using fallback for development');
}

// Create metadata for the app
const metadata = {
  name: "Real World Projects",
  description: "A blockchain-powered crowdfunding platform",
  url: window.location.origin || "https://realworldprojects.replit.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Define chains to use
const chains = [mainnet, sepolia] as const;

// Create wagmi config with proper transports for chains (required in v2)
const config = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Initialize Web3Modal with the new Wagmi v2 syntax
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#7857FF",
    "--w3m-font-family": "Inter, sans-serif",
    "--w3m-border-radius-master": "8px",
  },
  defaultChain: mainnet,
  featuredWalletIds: [],
  metadata
});

// Render the application with WagmiProvider instead of WagmiConfig
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>,
);
