import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';

import App from "./App";
import "./index.css";
import { config } from "./lib/rainbowkit-config";

// Create a client for React Query
const queryClient = new QueryClient();

// Render application with RainbowKit and Wagmi providers
createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider 
        theme={{
          lightMode: lightTheme({ 
            accentColor: '#7857FF',
            borderRadius: 'medium'
          }),
          darkMode: darkTheme({ 
            accentColor: '#7857FF',
            borderRadius: 'medium'
          })
        }}
      >
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
