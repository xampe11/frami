// ProjectPage.tsx - With fixed property names and wallet handling
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project, Category, User } from "@shared/schema";
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
import { AlertCircle, Clock, Users, ChevronLeft, Share2, Heart, AlertTriangle, FileText } from "lucide-react";
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
  
  // Fetch project category
  const { data: category, isLoading: isLoadingCategory } = useQuery<Category>({
    queryKey: [`/api/categories/${project?.categoryId}`],
    enabled: !!project?.categoryId,
  });

  // Fetch project creator
  const { data: creator, isLoading: isLoadingCreator } = useQuery<User>({
    queryKey: [`/api/users/${project?.creatorId}`],
    enabled: !!project?.creatorId,
  });
  
  // Set page title when project is loaded
  useEffect(() => {
    if (project && !isLoading) {
      document.title = `${project.title} | Frami`;
    } else {
      document.title = "Project Details | Frami";
    }
  }, [project, isLoading]);

  // Animate project content on load
  useEffect(() => {
    if (project && !isLoading) {
      gsap.fromTo(
        ".project-content",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }
      );
    }
  }, [project, isLoading]);
  
  // Show loading state when any required data is loading
  if (isLoading || isLoadingCategory || isLoadingCreator) {
    return (
      <div className="container mx-auto px-4 sm:px-6 max-w-[110rem] py-16">
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
      <div className="container mx-auto px-4 sm:px-6 max-w-[110rem] pt-20 pb-16 md:pt-24">
        <div className="max-w-5xl mx-auto text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold dark:text-white">Project not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error instanceof Error 
              ? `Error: ${error.message}` 
              : "The project you're looking for doesn't exist or has been removed."}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={() => navigate("/")}>Back to Home</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
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
    <div className="container mx-auto px-4 sm:px-6 max-w-[110rem] pt-20 pb-8 md:pt-24 md:pb-16">
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
                  {category && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30">
                      {category.name}
                    </Badge>
                  )}
                </div>
                
                <Tabs defaultValue="about" className="mt-6">
                  <TabsList className="mb-6">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                    <TabsTrigger value="backers">Backers</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="project-content">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-semibold mb-4 dark:text-white">About this project</h3>
                      <p className="dark:text-gray-300 mb-6">{project.description}</p>
                      
                      <h3 className="text-xl font-semibold mb-4 dark:text-white">The story</h3>
                      {project.story ? (
                        project.story.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="dark:text-gray-300 mb-4">{paragraph}</p>
                        ))
                      ) : (
                        <p className="dark:text-gray-300 mb-4">No detailed story has been provided for this project yet.</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="updates" className="project-content">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-medium mb-2 dark:text-white">No updates yet</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">The creator hasn't posted any updates for this project yet.</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Project updates will appear here once the creator shares progress, milestones, or important announcements.</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="backers" className="project-content">
                    {backerCount > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                          <Users className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" />
                          <p className="text-lg font-medium dark:text-white">{backerCount} backers have contributed so far</p>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                          {/* This would be a mapped list of backers in a real implementation */}
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">0x...</span>
                              </div>
                              <div>
                                <p className="font-medium dark:text-white">Anonymous Backer</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Backed 3 days ago</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-amber-600 dark:text-amber-500">5 {fundingCurrency}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">First-time backer</p>
                            </div>
                          </div>
                          
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">0x...</span>
                              </div>
                              <div>
                                <p className="font-medium dark:text-white">Blockchain Enthusiast</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Backed 5 days ago</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-amber-600 dark:text-amber-500">20 {fundingCurrency}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Backed 5 projects</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-8 text-center">
                        <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2 dark:text-white">No backers yet</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">Be the first to back this project!</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your wallet and contribute to help bring this project to life.</p>
                      </div>
                    )}
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
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Raised so far</div>
                    <div className="font-semibold text-lg dark:text-white">
                      {project.currentFunding} {fundingCurrency}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Funding goal</div>
                    <div className="font-semibold text-lg dark:text-white">
                      {project.fundingGoal} {fundingCurrency}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
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
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {creator?.username?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium dark:text-white">{creator?.username || 'Anonymous Creator'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Project Creator</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {creator?.bio || 'Creating innovative blockchain projects'}
                </p>
                
                {creator?.walletAddress && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Creator wallet address:</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono break-all">
                        {creator.walletAddress}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 w-6 p-0" 
                        onClick={() => {
                          if (creator?.walletAddress) {
                            navigator.clipboard.writeText(creator.walletAddress);
                            toast({
                              title: "Address copied",
                              description: "Wallet address copied to clipboard"
                            });
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <span>Verified creator with 4 successful projects</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;