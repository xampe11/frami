import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, User, Category, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Users, 
  ChevronLeft, 
  Share2, 
  BookmarkIcon,
  AlertCircle
} from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateProgress, formatCurrency, generateRandomHash } from "@/lib/utils";
import ProjectProgress from "@/components/projects/project-progress";
import { useGsapReveal } from "@/hooks/use-gsap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProjectDetails() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/projects/:slug");
  const [backingAmount, setBackingAmount] = useState<string>("100");
  const [showBackingDialog, setShowBackingDialog] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);
  const { isConnected, address, connect } = useWallet();
  const { toast } = useToast();
  
  useGsapReveal(sectionRef);
  
  // Set page title
  useEffect(() => {
    document.title = "Project Details | Frami";
  }, []);
  
  // Fetch project data
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery({
    queryKey: [`/api/projects/${params?.slug}`],
    enabled: !!params?.slug,
  });
  
  // Update page title when project is loaded
  useEffect(() => {
    if (project) {
      document.title = `${project.title} | Frami`;
    }
  }, [project]);
  
  // Fetch project creator
  const { data: creator, isLoading: isLoadingCreator } = useQuery({
    queryKey: [`/api/users/${project?.creatorId}`],
    enabled: !!project?.creatorId,
  });
  
  // Fetch project category
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: [`/api/categories/${project?.categoryId}`],
    enabled: !!project?.categoryId,
  });
  
  // Back project mutation
  const backProjectMutation = useMutation({
    mutationFn: async () => {
      if (!isConnected || !address || !project) {
        throw new Error("Wallet connection required");
      }
      
      const amount = parseFloat(backingAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }
      
      // In a real app, this would make a request to the blockchain
      // For the MVP, we'll simulate it with a simple API call
      const transactionData = {
        userId: 1, // Demo user ID
        projectId: project.id,
        amount,
        walletAddress: address,
        status: "pending",
      };
      
      // Create the transaction
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      const transaction = await response.json();
      
      // Simulate a blockchain confirmation
      setTimeout(async () => {
        await apiRequest("PATCH", `/api/transactions/${transaction.id}`, {
          status: "completed",
          transactionHash: generateRandomHash()
        });
      }, 2000);
      
      return transaction;
    },
    onSuccess: () => {
      toast({
        title: "Project backed successfully!",
        description: "Thank you for supporting this project.",
      });
      setShowBackingDialog(false);
      
      // Refetch the project to update the funding progress
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to back project",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleBackProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to back this project.",
        variant: "destructive",
      });
      return;
    }
    
    backProjectMutation.mutate();
  };
  
  const handleSaveProject = () => {
    setSaved(!saved);
    toast({
      title: saved ? "Project removed from bookmarks" : "Project saved to bookmarks",
      description: saved ? "You can add it back anytime." : "You can find it in your saved projects.",
    });
  };
  
  const handleShareProject = () => {
    if (navigator.share) {
      navigator.share({
        title: project?.title,
        text: project?.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share it with others.",
      });
    }
  };
  
  // If there's an error or project not found
  if (projectError || (!isLoadingProject && !project)) {
    return (
      <div className="container mx-auto px-4 sm:px-6 max-w-[90rem] py-16 text-center">
        <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
        <p className="text-slate mb-8">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <a href="/explore">Explore Other Projects</a>
        </Button>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingProject || isLoadingCreator || isLoadingCategory) {
    return (
      <div className="container mx-auto px-4 sm:px-6 max-w-[90rem] py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to projects
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="w-full h-[400px] rounded-xl mb-6" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-3/4 mb-6" />
            
            <div className="mt-8">
              <Skeleton className="h-8 w-40 mb-4" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-3/4 mb-2" />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6 sticky top-24">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-7 w-full mb-4" />
              
              <Skeleton className="h-2 w-full mb-6" />
              
              <div className="flex justify-between mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
              
              <Skeleton className="h-10 w-full mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate progress
  const progress = calculateProgress(project.raisedAmount, project.goalAmount);

  return (
    <section ref={sectionRef} className="py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-[90rem]">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/explore")} className="group">
            <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to projects
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <img 
              src={project.thumbnailUrl} 
              alt={project.title} 
              className="w-full h-auto rounded-xl shadow-lg mb-6 object-cover"
              style={{ maxHeight: '500px' }}
            />
            
            <div className="flex flex-wrap gap-3 mb-6">
              {category && (
                <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full uppercase font-bold">
                  {category.name}
                </span>
              )}
              {project.featured && (
                <span className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full uppercase font-bold">
                  Featured
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold font-inter mb-4">{project.title}</h1>
            <p className="text-slate text-lg mb-6">{project.description}</p>
            
            <Tabs defaultValue="story" className="mt-8">
              <TabsList>
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="backers">Backers</TabsTrigger>
              </TabsList>
              <TabsContent value="story" className="mt-6">
                <div className="prose prose-slate max-w-none">
                  {project.story.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="updates" className="mt-6">
                <div className="rounded-lg border p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No Updates Yet</h3>
                  <p className="text-slate">
                    The creator hasn't posted any updates yet. Check back soon!
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="backers" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Users className="h-10 w-10 text-primary mr-4" />
                    <div>
                      <p className="font-medium">{project.backers} backers</p>
                      <p className="text-sm text-slate">
                        Have backed this project
                      </p>
                    </div>
                  </div>
                  
                  {project.backers === 0 ? (
                    <div className="rounded-lg border p-8 text-center">
                      <h3 className="text-lg font-semibold mb-2">No Backers Yet</h3>
                      <p className="text-slate">
                        Be the first to back this project!
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate">
                      Backer details are kept private for security reasons.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6 sticky top-24">
              <ProjectProgress 
                raisedAmount={project.raisedAmount}
                goalAmount={project.goalAmount} 
                showAmounts
                size="lg"
                className="mb-6"
              />
              
              <div className="flex justify-between text-sm mb-6">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-slate" />
                  <span>{project.backers} backers</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-slate" />
                  <span>{project.daysLeft} days left</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  {creator?.avatarUrl && (
                    <img 
                      src={creator.avatarUrl} 
                      alt={creator.username} 
                      className="h-10 w-10 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="text-sm text-slate">Created by</p>
                    <p className="font-medium">{creator?.username || 'Unknown creator'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Dialog open={showBackingDialog} onOpenChange={setShowBackingDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Back this project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Back this project</DialogTitle>
                      <DialogDescription>
                        Support {project.title} by contributing with cryptocurrency
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleBackProject}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Contribution amount (USD)</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            step="1"
                            value={backingAmount}
                            onChange={(e) => setBackingAmount(e.target.value)}
                            placeholder="Enter amount"
                          />
                          <p className="text-xs text-slate">
                            Min contribution: $1
                          </p>
                        </div>
                        
                        {!isConnected && (
                          <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="pt-4 pb-2">
                              <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-800">
                                    Wallet not connected
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    Please connect your wallet to back this project.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      <DialogFooter className="gap-2 sm:gap-0">
                        {!isConnected ? (
                          <Button 
                            type="button" 
                            className="w-full" 
                            onClick={() => connect("metamask")}
                          >
                            Connect Wallet
                          </Button>
                        ) : (
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={backProjectMutation.isPending}
                          >
                            {backProjectMutation.isPending ? (
                              <>
                                <span className="animate-spin mr-2">⚙️</span>
                                Processing...
                              </>
                            ) : (
                              <>Back with {formatCurrency(parseFloat(backingAmount) || 0)}</>
                            )}
                          </Button>
                        )}
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="flex-1"
                    onClick={handleSaveProject}
                    aria-label={saved ? "Unsave project" : "Save project"}
                  >
                    <BookmarkIcon className={`h-5 w-5 ${saved ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="flex-1"
                    onClick={handleShareProject}
                    aria-label="Share project"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-slate mt-6 text-center">
                This project will only be funded if it reaches its goal by the deadline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
