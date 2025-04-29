import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { WalletProvider } from "./components/wallet/wallet-provider";

// Get project ID from environment variable 
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// Check if project ID is available
if (!projectId) {
  console.warn('VITE_WALLET_CONNECT_PROJECT_ID is not set in environment variables');
}

// Render application with WalletProvider wrapping the app
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <App />
    </WalletProvider>
  </QueryClientProvider>
);
