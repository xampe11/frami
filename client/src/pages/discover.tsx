import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SmallProjectCard from "@/components/projects/small-project-card";
import gsap from "gsap";
import { Search, X } from "lucide-react";

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  // Fetch all projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Filter projects whenever search term, selected category, or projects data changes
  useEffect(() => {
    if (projects) {
      let filtered = [...projects];
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (project) =>
            project.title.toLowerCase().includes(search) ||
            project.shortDescription.toLowerCase().includes(search)
        );
      }
      
      if (selectedCategory !== null) {
        filtered = filtered.filter(
          (project) => project.categoryId === selectedCategory
        );
      }
      
      setFilteredProjects(filtered);
      
      // Animate project cards when they are filtered
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
  }, [searchTerm, selectedCategory, projects]);
  
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Discover Projects</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find and fund innovative real-world projects with the transparency and efficiency of blockchain technology.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="relative flex-grow">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="pl-10 py-6"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {(searchTerm || selectedCategory !== null) && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="md:self-start"
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all">
          <div className="mb-8 border-b">
            <TabsList className="mx-auto mb-0 w-full justify-start bg-transparent">
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
          </div>
          
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className={`rounded-full px-4 py-2 text-sm ${
                    selectedCategory === category.id
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
          
          <TabsContent value="all">
            {projectsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-0">
                      <div className="aspect-w-16 aspect-h-10">
                        <div className="w-full h-full bg-gray-200" />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-full mt-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <SmallProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters to find what you're looking for
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="featured">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {projects
                ?.filter((p) => p.featured)
                .map((project) => (
                  <SmallProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trending">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {projects
                ?.filter((p) => p.trending)
                .map((project) => (
                  <SmallProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="new">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {projects
                ?.filter((p) => p.isNew)
                .map((project) => (
                  <SmallProjectCard key={project.id} project={project} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Discover;
