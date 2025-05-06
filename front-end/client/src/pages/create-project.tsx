import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/wallet-context";
import { apiRequest } from "@/lib/queryClient";
import { slugify, generateRandomHash } from "@/lib/utils";
import { useGsapReveal } from "@/hooks/use-gsap";
import { 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  HelpCircle,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Loader2,
  Wallet,
  Gift,
  CheckCircle
} from "lucide-react";

// Extend the insert schema to add client-side validation
const formSchema = insertProjectSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(80, "Title cannot exceed 80 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(200, "Description cannot exceed 200 characters"),
  story: z.string().min(100, "Story must be at least 100 characters"),
  thumbnailUrl: z.string().url("Please enter a valid URL"),
  goalAmount: z.number().min(100, "Goal must be at least $100"),
  daysLeft: z.number().min(1, "Campaign must run for at least 1 day").max(90, "Campaign cannot exceed 90 days"),
  // These fields are set programmatically, but we need them for the form
  categoryId: z.number().min(1, "Please select a category"),
  creatorId: z.number().default(1), // Default to demo user ID
  slug: z.string().optional(), // Generated from title
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  isFlexibleFunding: z.boolean().default(false), // New field for flexible funding option
  teamMembers: z.array(z.string()).default([]),   // New field for team members
  tagline: z.string().max(100, "Tagline cannot exceed 100 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateProject() {
  const [, navigate] = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isConnected, isConnecting, connect } = useWallet();
  
  useGsapReveal(sectionRef);
  
  // Set page title
  useEffect(() => {
    document.title = "Create Project | Real World Projects";
  }, []);
  
  // Check if wallet is connected on component mount
  useEffect(() => {
    // Check localStorage directly to handle wallet state persistence
    try {
      const savedWallet = localStorage.getItem("wallet");
      if (savedWallet && !isConnected) {
        console.log("Found wallet in localStorage but not connected in state");
        // If wallet exists in localStorage but isConnected is false
        // This could indicate that the wallet state was not properly loaded
        // We won't reload here to avoid loops, but connect if a wallet click happens
      }
    } catch (error) {
      console.error("Error checking wallet localStorage:", error);
    }
  }, [isConnected]);
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Setup form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      story: "",
      thumbnailUrl: "",
      goalAmount: 10000,
      daysLeft: 30,
      categoryId: 0,
      creatorId: 1, // Default to demo user ID
      featured: false,
      trending: false,
      tagline: "",
      isFlexibleFunding: false,
      teamMembers: [],
    },
  });
  
  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (values: FormValues) => {
      // Generate a slug from the title
      const slug = slugify(values.title);
      
      // Create the project
      const response = await apiRequest("POST", "/api/projects", {
        ...values,
        slug,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project created successfully!",
        description: "Your project is now live.",
      });
      
      // Navigate to the project page
      navigate(`/projects/${data.slug}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (!isConnected) {
      toast({
        title: "Wallet connection required",
        description: "Please connect your wallet to create a project.",
        variant: "destructive",
      });
      return;
    }
    
    createProject.mutate(values);
  };
  
  // Keep goal amount numeric
  const handleGoalChange = (value: number) => {
    form.setValue("goalAmount", value, { shouldValidate: true });
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [newTeamMember, setNewTeamMember] = useState("");
  
  // Steps for project creation
  const steps = [
    { 
      id: "details", 
      name: "Basic Info", 
      icon: <FileText size={18} />
    },
    { 
      id: "team", 
      name: "Team", 
      icon: <Users size={18} />
    },
    { 
      id: "nfts", 
      name: "NFT Rewards", 
      icon: <Gift size={18} />
    },
    { 
      id: "funding", 
      name: "Funding", 
      icon: <DollarSign size={18} />
    },
    { 
      id: "review", 
      name: "Review", 
      icon: <CheckCircle size={18} />
    }
  ];
  
  // Add team member
  const handleAddTeamMember = () => {
    if (newTeamMember && newTeamMember.startsWith("0x")) {
      const currentTeamMembers = form.getValues("teamMembers") || [];
      form.setValue("teamMembers", [...currentTeamMembers, newTeamMember]);
      setNewTeamMember("");
    } else {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address starting with 0x",
        variant: "destructive",
      });
    }
  };
  
  // Remove team member
  const handleRemoveTeamMember = (index: number) => {
    const currentTeamMembers = form.getValues("teamMembers") || [];
    const updatedMembers = [...currentTeamMembers];
    updatedMembers.splice(index, 1);
    form.setValue("teamMembers", updatedMembers);
  };
  
  // Next step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div ref={sectionRef} className="pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-inter mb-2">CREATE A PROJECT</h1>
        </div>
        
        {!isConnected ? (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
            <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-slate-600 mb-6">
              You need to connect your cryptocurrency wallet to create and manage your project.
            </p>
            <Button 
              onClick={async () => {
                try {
                  await connect("metamask");
                  // Force page refresh after successful connection
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                } catch (err) {
                  console.error("Failed to connect wallet:", err);
                  toast({
                    title: "Connection Failed",
                    description: "Could not connect to wallet. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-primary hover:bg-primary/90" 
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⚙️</span>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-2">💰</span>
                  Connect Wallet
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="mb-8">
            {/* Progress Steps - Complete redesign to remove line issues */}
            <div className="mb-8 border-t border-b py-6">
              <div className="flex justify-between items-center">
                {/* Step indicators with custom connecting lines */}
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center relative">
                    {/* Custom connecting lines - display between steps */}
                    {index > 0 && (
                      <div className={`absolute right-[calc(100%+0.75rem)] top-5 w-full h-0.5 
                        ${index <= currentStep ? 'bg-primary' : 'bg-gray-200'}`} 
                        style={{width: 'calc(100% + 1.5rem)', right: 'calc(100% + 0.75rem)'}}
                      />
                    )}
                    
                    {/* The step circle */}
                    <div 
                      className={`flex items-center justify-center w-10 h-10 mb-2 rounded-full ${
                        currentStep === index 
                          ? 'bg-primary text-white' 
                          : index < currentStep 
                            ? 'bg-primary/20 text-primary'
                            : 'bg-gray-100 text-gray-400'
                      } cursor-pointer z-10`}
                      onClick={() => setCurrentStep(index)}
                    >
                      {step.icon}
                    </div>
                    
                    {/* Step name */}
                    <span className={`text-xs font-medium mt-1 ${
                      currentStep === index ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Step 1: Project Details */}
                {currentStep === 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold mb-6">Project Details</h2>
                    <p className="text-gray-600 mb-8">
                      Enter your project's details. You can edit your project's details at any time after
                      you deploy your project, but the transaction will cost gas.
                    </p>
                    
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <span className="text-red-500 mr-1">*</span> Project Name
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your project name" 
                                {...field} 
                                className="border-gray-300 focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tagline</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Add a brief one-sentence summary of your project" 
                                {...field} 
                                className="border-gray-300 focus:border-primary"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Add a brief one-sentence summary of your project
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your project in detail" 
                                {...field} 
                                rows={6}
                                className="border-gray-300 focus:border-primary"
                              />
                            </FormControl>
                            <FormDescription className="text-xs mt-2">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">About</h3>
                                <p className="mb-4">Contributors are more likely to fund your project if they're passionate about your idea and feel like they can trust you. Here are a few suggestions for what to cover in this section:</p>
                                <ol className="list-decimal pl-5 space-y-2">
                                  <li>Introduce the team behind your project and what you've worked on before</li>
                                  <li>Briefly describe your project and why you think it's important</li>
                                  <li>Include a call to action for supporters and what they will get</li>
                                </ol>
                              </div>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="thumbnailUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                {...field} 
                                className="border-gray-300 focus:border-primary"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Upload your project logo to a hosting service and paste the URL here
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* Step 2: Team Management */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold mb-6">Team Management</h2>
                    <p className="text-gray-600 mb-8">
                      Add team members who will help manage your project. Your wallet address will automatically be included as the project creator.
                    </p>
                    
                    <div className="mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="font-semibold">Project Creator</h3>
                        <p className="text-gray-500 text-sm">{form.getValues("creatorId") ? `User ID: ${form.getValues("creatorId")}` : "Connect wallet to see your address"}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold">Additional Team Members</h3>
                        
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Enter wallet address (0x...)" 
                            value={newTeamMember}
                            onChange={(e) => setNewTeamMember(e.target.value)}
                            className="border-gray-300 focus:border-primary"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddTeamMember}
                            className="bg-primary hover:bg-primary/90"
                          >
                            Add
                          </Button>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          {form.getValues("teamMembers")?.map((member, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                              <span className="text-sm font-mono">{member}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveTeamMember(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          
                          {(!form.getValues("teamMembers") || form.getValues("teamMembers").length === 0) && (
                            <p className="text-gray-500 text-sm italic">No additional team members added</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: NFTs */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold mb-6">NFT Rewards</h2>
                    <p className="text-gray-600 mb-6">
                      Set up NFT rewards for your backers. Offer exclusive digital collectibles tied to different funding tiers.
                    </p>
                    
                    <div className="space-y-6">
                      {/* NFT Reward Tiers */}
                      <div className="space-y-6 mb-6">
                        <h3 className="text-lg font-medium">Reward Tiers</h3>
                        
                        {/* Basic Tier */}
                        <div className="border border-gray-200 rounded-lg p-6 transition-all hover:border-primary/50 hover:shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg mb-1">Basic Supporter</h4>
                              <p className="text-primary font-medium mb-2">$50+</p>
                              <p className="text-sm text-gray-600 mb-4">Exclusive digital badge NFT recognizing your early support</p>
                              
                              <div className="flex items-center text-xs text-gray-500">
                                <span className="flex items-center mr-4">
                                  <Users size={14} className="mr-1" />
                                  Limited (100)
                                </span>
                                <span className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  Delivery: After funding
                                </span>
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Gift size={24} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Premium Tier */}
                        <div className="border border-gray-200 rounded-lg p-6 transition-all hover:border-primary/50 hover:shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg mb-1">Premium Backer</h4>
                              <p className="text-primary font-medium mb-2">$250+</p>
                              <p className="text-sm text-gray-600 mb-4">Animated collectible NFT with special access to project updates</p>
                              
                              <div className="flex items-center text-xs text-gray-500">
                                <span className="flex items-center mr-4">
                                  <Users size={14} className="mr-1" />
                                  Limited (50)
                                </span>
                                <span className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  Delivery: After funding
                                </span>
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Gift size={24} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Founding Member Tier */}
                        <div className="border border-gray-200 rounded-lg p-6 transition-all hover:border-primary/50 hover:shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg mb-1">Founding Member</h4>
                              <p className="text-primary font-medium mb-2">$1000+</p>
                              <p className="text-sm text-gray-600 mb-4">Rare founding member NFT with voting rights on project milestones</p>
                              
                              <div className="flex items-center text-xs text-gray-500">
                                <span className="flex items-center mr-4">
                                  <Users size={14} className="mr-1" />
                                  Limited (10)
                                </span>
                                <span className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  Delivery: After funding
                                </span>
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Gift size={24} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <p className="text-sm text-blue-700">
                            NFT rewards are an optional feature. You can proceed with project creation without configuring NFT rewards.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 4: Deadline */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold mb-6">Funding Details</h2>
                    <p className="text-gray-600 mb-8">
                      Set your funding goals and campaign duration.
                    </p>
                    
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="goalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <span className="text-red-500 mr-1">*</span> Funding Goal (USD)
                            </FormLabel>
                            <div className="space-y-4">
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="mr-2">$</span>
                                  <Input 
                                    type="number" 
                                    min={100} 
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    className="border-gray-300 focus:border-primary"
                                  />
                                </div>
                              </FormControl>
                              <Slider
                                defaultValue={[10000]}
                                min={100}
                                max={100000}
                                step={100}
                                value={[field.value]}
                                onValueChange={(values) => handleGoalChange(values[0])}
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>$100</span>
                                <span>$100,000</span>
                              </div>
                            </div>
                            <FormDescription className="text-xs">
                              Set a realistic funding goal for your project
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="daysLeft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <span className="text-red-500 mr-1">*</span> Campaign Duration
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input 
                                  type="number" 
                                  min={1}
                                  max={90}
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  className="border-gray-300 focus:border-primary"
                                />
                                <span className="ml-2">days</span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              How long will your fundraising campaign run? (1-90 days)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isFlexibleFunding"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Flexible Funding
                              </FormLabel>
                              <FormDescription className="text-xs">
                                If enabled, you'll receive funds even if your goal isn't met. Otherwise, funds will be returned to backers if the goal isn't reached.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* Step 5: Deploy - Final Step */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold mb-6">Deploy Your Project</h2>
                    <p className="text-gray-600 mb-8">
                      Review your project details before deploying to the blockchain.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Project Name</h3>
                          <p>{form.getValues("title") || "Not set"}</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Description</h3>
                          <p className="line-clamp-3">{form.getValues("description") || "Not set"}</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Funding Goal</h3>
                          <p>${form.getValues("goalAmount") || 0}</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Campaign Duration</h3>
                          <p>{form.getValues("daysLeft") || 0} days</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Flexible Funding</h3>
                          <p>{form.getValues("isFlexibleFunding") ? "Yes" : "No"}</p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Team Members</h3>
                          <p>{(form.getValues("teamMembers")?.length || 0) + 1} members</p>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                          <p className="text-sm text-yellow-700">
                            Once deployed, some project details cannot be changed without creating a new transaction. Make sure all information is correct before proceeding.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Navigation */}
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={currentStep === 0 ? () => navigate("/explore") : goToPreviousStep}
                    className="gap-2"
                  >
                    {currentStep === 0 ? "Cancel" : (
                      <>
                        <ChevronLeft size={16} />
                        Back
                      </>
                    )}
                  </Button>
                  
                  {currentStep === steps.length - 1 ? (
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 gap-2"
                      disabled={createProject.isPending}
                    >
                      {createProject.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⚙️</span>
                          Deploying Project...
                        </>
                      ) : (
                        "Deploy Project"
                      )}
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      onClick={goToNextStep}
                      className="bg-primary hover:bg-primary/90 gap-2"
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}