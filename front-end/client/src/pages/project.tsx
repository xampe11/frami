// ProjectPage.tsx - With fixed property names and wallet handling
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Users, ChevronLeft, Share2, Heart, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import gsap from "gsap";

const ProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isConnected, connect, address } = useWallet();
  const [amount, setAmount] = useState<number>(0.1);
  
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${slug}`],
  });
  
  useEffect(() => {
    // Animate project content on load
    if (project && !isLoading) {
      gsap.fromTo(
        ".project-content",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }
      );
    }
  }, [project, isLoading]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="w-full h-80 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
          <div className="mt-8 w-2/3 h-10 bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
          <div className="mt-4 w-full h-32 bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
        </div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold dark:text-white">Project not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The project you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }
  
  // Fix property names to match your Project type
  const fundingCurrency = project.fundingCurrency || "ETH";
  const backerCount = project.backerCount || 0;
  const daysRemaining = project.daysRemaining || 30;
  
  const fundingPercentage = Math.min(
    Math.round((project.currentFunding / project.fundingGoal) * 100),
    100
  );
  
  const handleBackProject = async () => {
    try {
      if (!isConnected) {
        console.log("Connecting wallet before backing project");
        await connect();
        
        // Since state updates are asynchronous, return early and let UI update
        toast({
          title: "Wallet connected",
          description: "Now you can back this project",
        });
        return;
      }
      
      if (amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount to contribute",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Processing contribution",
        description: "Connecting to blockchain...",
      });
      
      console.log("Processing contribution of", amount, fundingCurrency);
      console.log("Current wallet address:", address);
      
      // Simulate blockchain transaction time
      setTimeout(() => {
        toast({
          title: "Contribution successful!",
          description: `You've contributed ${amount} ${fundingCurrency} to this project.`,
        });
        
        // Note: In a real implementation, we would make an API call to update the project
      }, 2000);
    } catch (error) {
      console.error("Error backing project:", error);
      toast({
        title: "Failed to process contribution",
        description: "There was an error connecting to your wallet. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to projects
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="project-content rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-md">
              <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="object-cover w-full h-full"
                />
              </div>
              
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 dark:text-white">{project.title}</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{project.shortDescription || project.description.substring(0, 120) + '...'}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30">
                    {project.categoryId}
                  </Badge>
                </div>
                
                <Tabs defaultValue="about" className="mt-6">
                  <TabsList className="mb-6">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                    <TabsTrigger value="backers">Backers</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="project-content">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="dark:text-gray-300">{project.description}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="updates" className="project-content">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-8 text-center">
                      <h3 className="text-lg font-medium mb-2 dark:text-white">No updates yet</h3>
                      <p className="text-gray-600 dark:text-gray-300">The creator hasn't posted any updates yet.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="backers" className="project-content">
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-700 rounded-lg p-8">
                      <Users className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" />
                      <p className="text-lg font-medium dark:text-white">{backerCount} backers have contributed so far</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 lg:mt-0 mt-4">
            <Card className="project-content shadow-md">
              <CardHeader>
                <CardTitle>Project Funding</CardTitle>
                <CardDescription>
                  Support this project with cryptocurrency
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium dark:text-white">{fundingPercentage}% funded</span>
                    <span className="font-medium text-amber-600 dark:text-amber-500">
                      {project.currentFunding} {fundingCurrency} of {project.fundingGoal} {fundingCurrency}
                    </span>
                  </div>
                  <Progress value={fundingPercentage} className="h-2" />
                </div>
                
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{backerCount} backers</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{daysRemaining} days left</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium mb-1 dark:text-white">
                      Contribution Amount ({fundingCurrency})
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <Button
                    className="w-full bg-primary hover:bg-primary-dark text-white"
                    onClick={handleBackProject}
                  >
                    {isConnected ? "Back this project" : "Connect wallet to contribute"}
                  </Button>
                  
                  {!isConnected && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        You need to connect your wallet before contributing to this project
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Heart className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="project-content shadow-md">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">About the creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">DC</span>
                  </div>
                  <div>
                    <h4 className="font-medium dark:text-white">Digital Creators Alliance</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">3 projects created</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Creating innovative blockchain projects since 2020
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;