import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { useWallet } from "@/context/wallet-context";
import { Loader2 } from "lucide-react";

// Create project schema with validation
const createProjectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase with hyphens)"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters").max(150, "Short description must be at most 150 characters"),
  creatorId: z.number().default(1), // We'll use a default value for the MVP
  categoryId: z.number({
    required_error: "Please select a category",
  }),
  thumbnailUrl: z.string().url("Please enter a valid URL for the thumbnail"),
  fundingGoal: z.number().min(0.1, "Funding goal must be at least 0.1"),
  fundingCurrency: z.string().default("ETH"),
  daysRemaining: z.number().min(1, "Days remaining must be at least 1").max(60, "Maximum campaign length is 60 days"),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  isNew: z.boolean().default(true),
});

type CreateProjectData = z.infer<typeof createProjectSchema>;

const CreateProject = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isConnected, connect } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      creatorId: 1,
      thumbnailUrl: "",
      fundingGoal: 1,
      fundingCurrency: "ETH",
      daysRemaining: 30,
      featured: false,
      trending: false,
      isNew: true,
    },
  });
  
  // Project creation mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project created!",
        description: "Your project has been created successfully.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // When the title changes, generate a slug from it
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    form.setValue("title", title);
    
    // Only auto-generate slug if the user hasn't modified it
    if (!form.getValues("slug") || form.getValues("slug") === form.getValues("title").toLowerCase().replace(/\s+/g, "-")) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
  };
  
  const onSubmit = async (data: CreateProjectData) => {
    if (!isConnected) {
      toast({
        title: "Connect your wallet",
        description: "You need to connect your wallet before creating a project",
        variant: "destructive",
      });
      await connect();
      return;
    }
    
    setIsSubmitting(true);
    createProjectMutation.mutate(data);
  };
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Create Your Project</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Launch your creative or innovative idea with the power and security of blockchain technology.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Fill in the details of your blockchain-based crowdfunding project
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a compelling title" 
                            {...field} 
                            onChange={handleTitleChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Make it catchy and descriptive
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="project-url-slug" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used in your project URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief overview of your project (150 chars max)" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A concise summary that will appear in project cards
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
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of your project" 
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Explain your project in detail, including goals and impact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                            ) : (
                              categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
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
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to your project's main image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="fundingGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Goal</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0.1" 
                            step="0.1" 
                            placeholder="1.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fundingCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                            <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                            <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="daysRemaining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Duration (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="60" 
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <CardFooter className="px-0 pt-6 flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-4"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isConnected}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      isConnected ? "Create Project" : "Connect Wallet to Create"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;
