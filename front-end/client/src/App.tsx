import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Project from "@/pages/project";
import CreateProject from "@/pages/create-project";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useMediaQuery } from "@/hooks/use-mobile";

function Router() {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

/*   useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const seedData = async () => {
        try {
          await apiRequest("POST", "/api/seed", {});
          console.log("Development data seeded successfully");
        } catch (error) {
          console.error("Failed to seed development data:", error);
        }
      };
      seedData();
    }
  }, []); */

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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/discover" component={Discover} />
          <Route path="/projects/:slug" component={Project} />
          <Route path="/create" component={CreateProject} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
