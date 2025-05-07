import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Category } from "@shared/schema";
import ProjectCard from "@/components/projects/project-card";
import SmallProjectCard from "@/components/projects/small-project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, SlidersHorizontal, X } from "lucide-react";
import { useGsapReveal } from "@/hooks/use-gsap";
import gsap from "gsap";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("trending");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  useGsapReveal(sectionRef);
  
  // Set page title
  useEffect(() => {
    document.title = "Explore Projects | RealWorld Projects";
  }, []);
  
  // Fetch all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Filter and sort projects whenever search, category, or projects data changes
  useEffect(() => {
    if (projects) {
      let filtered = [...projects];
      
      // Apply search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (project) =>
            project.title.toLowerCase().includes(search) ||
            project.description.toLowerCase().includes(search)
        );
      }
      
      // Apply category filter
      if (selectedCategory !== null) {
        filtered = filtered.filter(
          (project) => project.categoryId === selectedCategory
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "ending-soon":
            return a.daysRemaining - b.daysRemaining;
          case "most-funded":
            return b.currentFunding - a.currentFunding;
          case "most-backed":
            return b.backerCount - a.backerCount;
          case "trending":
          default:
            return b.trending === true ? -1 : 1;
        }
      });
      
      setFilteredProjects(filtered);
      
      // Animate cards when they are filtered
      gsap.fromTo(
        ".project-card",
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.05,
          ease: "power2.out"
        }
      );
    }
  }, [searchQuery, selectedCategory, sortBy, projects]);
  
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSortBy("trending");
  };
  
  if (isLoadingProjects || isLoadingCategories) {
    return (
      <section className="py-12 pt-28">
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
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-card">
                <Skeleton className="w-full h-48 dark:bg-slate-700" />
                <div className="p-5">
                  <Skeleton className="h-5 w-20 mb-2 dark:bg-slate-700" />
                  <Skeleton className="h-6 w-[80%] mb-2 dark:bg-slate-700" />
                  <Skeleton className="h-4 w-full mb-1 dark:bg-slate-700" />
                  <Skeleton className="h-4 w-[90%] mb-4 dark:bg-slate-700" />
                  
                  <Skeleton className="h-4 w-full mb-1 dark:bg-slate-700" />
                  <Skeleton className="h-2 w-full mb-4 dark:bg-slate-700" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Skeleton className="h-6 w-6 rounded-full mr-2 dark:bg-slate-700" />
                      <Skeleton className="h-4 w-20 dark:bg-slate-700" />
                    </div>
                    <Skeleton className="h-4 w-16 dark:bg-slate-700" />
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
    <section ref={sectionRef} className="py-12 pt-24 bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Discover innovative blockchain projects from creators around the world
            and fund the next big thing with transparency and security.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
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
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">View Mode</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        Grid View
                      </Button>
                      <Button
                        variant={viewMode === "compact" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("compact")}
                      >
                        Compact View
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Categories</h3>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        className="mr-2 mb-2"
                        onClick={() => handleCategorySelect(null)}
                      >
                        All Categories
                      </Button>
                      {categories?.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          className="mr-2 mb-2"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {(searchQuery || selectedCategory !== null || sortBy !== "trending") && (
                    <Button 
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-10">
          <TabsList className="mb-6 bg-transparent justify-start border-b w-full rounded-none">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
              onClick={() => handleCategorySelect(null)}
            >
              All Projects
            </TabsTrigger>
            <TabsTrigger 
              value="featured" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              Featured
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="new" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              New
            </TabsTrigger>
          </TabsList>
          
          <div className="mb-6 overflow-x-auto hide-scrollbar">
            <div className="flex space-x-2 pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="rounded-full whitespace-nowrap"
                onClick={() => handleCategorySelect(null)}
              >
                All Categories
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
          
          <TabsContent value="all">
            {filteredProjects.length > 0 ? (
              <div className={`grid grid-cols-1 ${viewMode === 'grid' 
                ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                {filteredProjects.map((project) => (
                  viewMode === 'grid' 
                    ? <ProjectCard key={project.id} project={project} />
                    : <SmallProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Filter className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">No Projects Found</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We couldn't find any projects matching your current filters. 
                  Try changing your search or clearing filters.
                </p>
                <Button className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="featured">
            <div className={`grid grid-cols-1 ${viewMode === 'grid' 
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {projects
                ?.filter((p) => p.featured === true)
                .map((project) => (
                  viewMode === 'grid' 
                    ? <ProjectCard key={project.id} project={project} />
                    : <SmallProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trending">
            <div className={`grid grid-cols-1 ${viewMode === 'grid' 
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {projects
                ?.filter((p) => p.trending === true)
                .map((project) => (
                  viewMode === 'grid' 
                    ? <ProjectCard key={project.id} project={project} />
                    : <SmallProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="new">
            <div className={`grid grid-cols-1 ${viewMode === 'grid' 
              ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {projects
                ?.filter((p) => new Date(p.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) // Projects less than 7 days old
                .map((project) => (
                  viewMode === 'grid' 
                    ? <ProjectCard key={project.id} project={project} />
                    : <SmallProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}