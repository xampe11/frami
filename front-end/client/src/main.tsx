import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { Suspense, lazy, useEffect } from 'react';

import Preloader from './components/preloader';
import App from "./App";
import "./index.css";

// Preload GSAP immediately
const preloadLibraries = async () => {
  try {
    // Use dynamic import to load GSAP
    const gsapModules = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger')
    ]);
    
    // Register ScrollTrigger plugin with GSAP
    const [gsap, { ScrollTrigger }] = gsapModules;
    gsap.default.registerPlugin(ScrollTrigger);
    
    console.log('GSAP and plugins successfully preloaded');
  } catch (error) {
    console.error('Failed to preload animation libraries:', error);
  }
};

// Start preloading immediately
preloadLibraries();

// Wrap App with Preloader for initial animation loading
function Main() {
  return (
    <>
      <Preloader />
      <App />
    </>
  );
}

// Render application with RainbowKit and Wagmi providers
createRoot(document.getElementById("root")!).render(
  <Main />
);
