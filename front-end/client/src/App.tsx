// app.tsx - Main application file
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia, polygon, bsc } from 'wagmi/chains';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { WalletProvider } from "@/contexts/wallet-context";
import { apiRequest } from "@/lib/queryClient";
import { ThemeProvider, useTheme } from "next-themes";

import Home from "@/pages/home";
import Projects from "@/pages/projects";
import Project from "@/pages/project";
import CreateProject from "@/pages/create-project";
import FounderNFT from "@/pages/founder-nft";
import FounderNFTDashboard from "@/pages/founder-nft-dashboard";
import MyProfile from "@/pages/my-profile";
import Docs from "@/pages/docs";
import Contact from "@/pages/contact";
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

const subgraphEndpoint = import.meta.env.VITE_SUBGRAPH_ENDPOINT ||
  'http://localhost:8000/subgraphs/id/QmS4iK7V2vCMcub96XJ1Dif7Kg2YKHhPVZRZB8dbdyF1Tm';

console.log('Using subgraph endpoint:', subgraphEndpoint);

// Create a client for graphql query
const apolloClient = new ApolloClient({
  uri: subgraphEndpoint, // The Graph Protocol endpoint
  cache: new InMemoryCache(),
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        if (typeof queryKey[0] === 'string' && queryKey[0].startsWith('/')) {
          const response = await apiRequest("GET", queryKey[0]);
          return response.json();
        }
        throw new Error(`Invalid queryKey: ${JSON.stringify(queryKey)}`);
      },
    },
  },
});

// Create Wagmi config with RainbowKit - Updated chains
const config = getDefaultConfig({
  appName: 'Frami',
  projectId: projectId,
  chains: [mainnet, sepolia, polygon, bsc],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
  ssr: false,
});

// Custom RainbowKit themes
const customLightTheme = lightTheme({
  accentColor: '#8A63D2',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
});

const customDarkTheme = darkTheme({
  accentColor: '#8A63D2',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
});

function RainbowKitProviderWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <RainbowKitProvider
      theme={theme === 'dark' ? customDarkTheme : customLightTheme}
    >
      {children}
    </RainbowKitProvider>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Handle client-side routing errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Application error:', error);
      toast({
        title: "Application Error",
        description: "An unexpected error occurred. Please refresh the page.",
        variant: "destructive",
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [toast]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProviderWrapper>
              <ApolloProvider client={apolloClient}>
                <WalletProvider>
                  <div className="min-h-screen bg-background flex flex-col">
                    <Navbar />
                    <main className="flex-1">
                      <Switch>
                        <Route path="/" component={Home} />
                        <Route path="/explore" component={Projects} />
                        <Route path="/project/:id" component={Project} />
                        <Route path="/create-project" component={CreateProject} />
                        <Route path="/founder-nft" component={FounderNFT} />
                        <Route path="/founder-nft-dashboard" component={FounderNFTDashboard} />
                        <Route path="/my-profile" component={MyProfile} />
                        <Route path="/docs" component={Docs} />
                        <Route path="/contact" component={Contact} />
                        <Route component={NotFound} />
                      </Switch>
                    </main>
                    <Footer />
                    <Toaster />
                  </div>
                </WalletProvider>
              </ApolloProvider>
            </RainbowKitProviderWrapper>
          </QueryClientProvider>
        </WagmiProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;