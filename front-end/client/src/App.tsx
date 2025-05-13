// app.tsx - Main application file
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { WalletProvider } from "@/contexts/wallet-context";
import { apiRequest } from "@/lib/queryClient";
import { ThemeProvider } from "next-themes";

import Home from "@/pages/home";
import Projects from "@/pages/projects";
import Project from "@/pages/project";
import CreateProject from "@/pages/create-project";
import FounderNFT from "@/pages/founder-nft";
import Docs from "@/pages/docs";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useMediaQuery } from "@/hooks/use-mobile";

// Get environment variables with fallback
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// Debug environment variables
console.log("Wallet Connect Project ID:", projectId ? "Found" : "Not found");
if (!projectId) {
  console.error("Missing VITE_WALLET_CONNECT_PROJECT_ID. Wallet Connect may not work properly.");
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set up a default query function that will be used for all queries
      // that don't explicitly provide a queryFn
      queryFn: async ({ queryKey }) => {
        // Assuming queryKey[0] is the API endpoint
        if (typeof queryKey[0] === 'string' && queryKey[0].startsWith('/')) {
          const response = await apiRequest("GET", queryKey[0]);
          return response.json();
        }
        throw new Error(`Invalid queryKey: ${JSON.stringify(queryKey)}`);
      },
    },
  },
});

// Create Wagmi config with RainbowKit
const config = getDefaultConfig({
  appName: 'Frami',
  projectId: projectId,
  chains: [mainnet, polygon],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
});

function Router() {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [location] = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    // Initialize Gsap ScrollTrigger
    const initGsap = async () => {
      if (typeof window !== "undefined") {
        const { gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        
        gsap.registerPlugin(ScrollTrigger);
        
        // Return cleanup function to kill all ScrollTriggers when component unmounts
        return () => {
          ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
      }
    };
    
    initGsap();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground dark:bg-slate-900">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Projects} />
          <Route path="/projects/:slug" component={Project} />
          <Route path="/create-project" component={CreateProject} />
          <Route path="/founder-nft" component={FounderNFT} />
          <Route path="/docs" component={Docs} />
          {/* Redirects for old routes */}
          <Route path="/projects">
            {() => {
              window.location.href = '/explore';
              return null;
            }}
          </Route>
          <Route path="/discover">
            {() => {
              window.location.href = '/explore';
              return null;
            }}
          </Route>
          {/* Redirects for old create project routes */}
          <Route path="/create">
            {() => {
              window.location.href = '/create-project';
              return null;
            }}
          </Route>
          <Route path="/start-project">
            {() => {
              window.location.href = '/create-project';
              return null;
            }}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <WalletProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </WalletProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

export default App;