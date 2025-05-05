import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';

import App from "./App";
import "./index.css";

// Render application with RainbowKit and Wagmi providers
createRoot(document.getElementById("root")!).render(
        <App />
);
