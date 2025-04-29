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
import { slugify } from "@/lib/utils";
import { useGsapReveal } from "@/hooks/use-gsap";

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
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateProject() {
  const [, navigate] = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isConnected, connect } = useWallet();
  
  useGsapReveal(sectionRef);
  
  // Set page title
  useEffect(() => {
    document.title = "Create Project | RealWorld Projects";
  }, []);
  
  // Check if user is connected to wallet
  useEffect(() => {
    if (!isConnected) {
      toast({
        title: "Wallet connection required",
        description: "Please connect your wallet to create a project.",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);
  
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
  
  return (
    <div ref={sectionRef} className="py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h1 className="text-3xl font-bold font-inter mb-2">Create a Project</h1>
        <p className="text-slate text-lg mb-8">
          Bring your creative project to life with blockchain technology
        </p>
        
        {!isConnected ? (
          <div className="bg-white rounded-xl shadow-card p-8 mb-8 text-center">
            <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-slate mb-6">
              You need to connect your cryptocurrency wallet to create and manage your project.
            </p>
            <Button onClick={() => connect("metamask")}>
              Connect Wallet
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="details" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="story">Story</TabsTrigger>
              <TabsTrigger value="funding">Funding</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <TabsContent value="details" className="mt-6">
                  <div className="bg-white rounded-xl shadow-card p-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a compelling title" {...field} />
                            </FormControl>
                            <FormDescription>
                              Make it clear and attention-grabbing
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
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your project in a few sentences" 
                                {...field} 
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              This will appear in project cards and search results (max 200 characters)
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
                            <FormLabel>Thumbnail Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the URL of your project's main image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose the category that best fits your project
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="story" className="mt-6">
                  <div className="bg-white rounded-xl shadow-card p-6">
                    <FormField
                      control={form.control}
                      name="story"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Story</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell potential backers about your project in detail" 
                              {...field} 
                              rows={15}
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your project in detail. What are you creating? Why does it matter? How will you execute it?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="funding" className="mt-6">
                  <div className="bg-white rounded-xl shadow-card p-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="goalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Funding Goal (USD)</FormLabel>
                            <div className="space-y-4">
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="mr-2">$</span>
                                  <Input 
                                    type="number" 
                                    min={100} 
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                              <div className="flex justify-between text-xs text-slate">
                                <span>$100</span>
                                <span>$100,000</span>
                              </div>
                            </div>
                            <FormDescription>
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
                            <FormLabel>Campaign Duration (Days)</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input 
                                  type="number" 
                                  min={1}
                                  max={90}
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                                <span className="ml-2">days</span>
                              </div>
                            </FormControl>
                            <FormDescription>
                              How long will your fundraising campaign run? (1-90 days)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/explore")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90"
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⚙️</span>
                        Creating Project...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        )}
      </div>
    </div>
  );
}
