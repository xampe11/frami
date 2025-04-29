import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@shared/schema";
import { ChevronRight } from "lucide-react";
import ProjectCard from "@/components/projects/project-card";
import { useGsapReveal } from "@/hooks/use-gsap";

export default function TrendingProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useGsapReveal(sectionRef);
  
  const { data: trendingProjects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/trending'],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

  if (!trendingProjects || !Array.isArray(trendingProjects) || trendingProjects.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="pt-0 pb-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-inter">Trending Projects</h2>
          <Link 
            href="/explore" 
            className="text-primary font-medium text-sm flex items-center hover:underline"
          >
            View all projects
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingProjects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
