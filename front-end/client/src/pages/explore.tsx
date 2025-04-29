import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Category } from "@shared/schema";
import ProjectCard from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useGsapReveal } from "@/hooks/use-gsap";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Explore() {
  const sectionRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("trending");
  
  useGsapReveal(sectionRef);
  
  // Set page title
  useEffect(() => {
    document.title = "Explore Projects | RealWorld Projects";
  }, []);
  
  // Fetch all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Filter and sort projects
  const filteredProjects = projects
    ? projects.filter((project: Project) => {
        // Category filter
        const matchesCategory = selectedCategory === "all" || 
          project.categoryId === Number(selectedCategory);
        
        // Search filter
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          project.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
      })
    : [];
  
  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a: Project, b: Project) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "ending-soon":
        return a.daysLeft - b.daysLeft;
      case "most-funded":
        return b.raisedAmount - a.raisedAmount;
      case "most-backed":
        return b.backers - a.backers;
      case "trending":
      default:
        return b.trending ? -1 : 1;
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled via the state
  };
  
  if (isLoadingProjects || isLoadingCategories) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
            <Skeleton className="h-10 w-full md:w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-card">
                <Skeleton className="w-full h-48" />
                <div className="p-5">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-6 w-[80%] mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-[90%] mb-4" />
                  
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-2 w-full mb-4" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Skeleton className="h-6 w-6 rounded-full mr-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-inter mb-4">Explore Projects</h1>
          <p className="text-slate text-lg">
            Discover innovative blockchain projects from creators around the world
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="most-funded">Most Funded</SelectItem>
                <SelectItem value="most-backed">Most Backed</SelectItem>
              </SelectContent>
            </Select>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow down projects by category, funding status, and more
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Categories</h3>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        size="sm"
                        className="mr-2 mb-2"
                        onClick={() => setSelectedCategory("all")}
                      >
                        All Categories
                      </Button>
                      {categories?.map((category: Category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === String(category.id) ? "default" : "outline"}
                          size="sm"
                          className="mr-2 mb-2"
                          onClick={() => setSelectedCategory(String(category.id))}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <div className="mb-6 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-2 pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {categories?.map((category: Category) => (
              <Button
                key={category.id}
                variant={selectedCategory === String(category.id) ? "default" : "outline"}
                size="sm"
                className="rounded-full whitespace-nowrap"
                onClick={() => setSelectedCategory(String(category.id))}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
        
        {sortedProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProjects.map((project: Project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Filter className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Projects Found</h3>
            <p className="text-slate max-w-md mx-auto">
              We couldn't find any projects matching your current filters. 
              Try changing your search or clearing filters.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSortBy("trending");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
