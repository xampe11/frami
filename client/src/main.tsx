import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { createWeb3Modal } from "@web3modal/wagmi/react";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Use VITE_ prefix for environment variables in Vite
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('VITE_WALLET_CONNECT_PROJECT_ID is not set in environment variables');
}

// Define metadata
const metadata = {
  name: "Real World Projects",
  description: "A blockchain-powered crowdfunding platform",
  url: window.location.origin || "https://realworldprojects.replit.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

// Supported chains
const chains = [mainnet, sepolia] as const;

// Create wagmi config
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
});

// Create Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#7857FF',
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-border-radius-master': '8px',
  },
  enableAnalytics: false
});

// Render application
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>,
);
