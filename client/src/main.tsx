import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createWeb3Modal } from "@web3modal/wagmi";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { wagmiConfig } from "./lib/web3Config";

// Get project ID from environment variable (without as string conversion for direct check)
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// Check if project ID is available
if (!projectId) {
  console.warn('VITE_WALLET_CONNECT_PROJECT_ID is not set in environment variables');
}

// Initialize Web3Modal with wagmiConfig
createWeb3Modal({
  wagmiConfig,
  projectId: projectId as string,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#7857FF',
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-border-radius-master': '8px',
  },
  // Explicitly enable
  enableAnalytics: false,
  // Add some additional parameters
  defaultChain: wagmiConfig.chains[0],
});

// Render application with WagmiProvider using the preconfigured wagmiConfig
// The WagmiProvider must wrap the QueryClientProvider so Web3Modal context is available
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>,
);
