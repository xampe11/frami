import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FeaturedProjectCard from "@/components/projects/featured-project-card";
import { useGsapReveal } from "@/hooks/use-gsap";

export default function FeaturedProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  useGsapReveal(sectionRef);
  
  const { data: featuredProjects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/projects/featured'],
    queryFn: async () => {
      console.log('Fetching featured projects...');
      const response = await fetch('/api/projects/featured');
      if (!response.ok) throw new Error('Failed to fetch featured projects');
      const data = await response.json();
      console.log('Featured projects data:', data);
      return data || [];
    },
    retry: 3,
    staleTime: 60000  // 1 minute
  });

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const initAnimation = async () => {
      if (typeof window !== "undefined" && featuredProjects && featuredProjects.length > 0) {
        const { gsap } = await import("gsap");
        
        // Animate featured projects
        gsap.from('.featured-project', {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%"
          }
        });
      }
    };
    
    if (featuredProjects && featuredProjects.length > 0) {
      initAnimation();
    }
  }, [featuredProjects]);

  if (isLoading) {
    return (
      <section className="py-12 bg-light dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48 dark:bg-slate-700" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-9 rounded-full dark:bg-slate-700" />
              <Skeleton className="h-9 w-9 rounded-full dark:bg-slate-700" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-card dark:shadow-slate-700/10">
                <Skeleton className="w-full h-64 dark:bg-slate-700" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Skeleton className="h-5 w-20 mb-2 dark:bg-slate-700" />
                      <Skeleton className="h-7 w-48 dark:bg-slate-700" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full dark:bg-slate-700" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2 dark:bg-slate-700" />
                  <Skeleton className="h-4 w-[90%] mb-6 dark:bg-slate-700" />
                  
                  <Skeleton className="h-4 w-full mb-1 dark:bg-slate-700" />
                  <Skeleton className="h-2 w-full mb-4 dark:bg-slate-700" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-2 dark:bg-slate-700" />
                      <div>
                        <Skeleton className="h-3 w-16 mb-1 dark:bg-slate-700" />
                        <Skeleton className="h-4 w-24 dark:bg-slate-700" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-3 w-16 mb-1 dark:bg-slate-700" />
                      <Skeleton className="h-4 w-16 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error("Error fetching featured projects:", error);
    return (
      <section className="py-12 bg-light dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-inter text-black dark:text-white mb-4">Featured Projects</h2>
            <p className="text-red-500 dark:text-red-400">Failed to load featured projects. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredProjects || featuredProjects.length === 0) {
    console.log("No featured projects found or empty array returned");
    return (
      <section className="py-12 bg-light dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-inter text-black dark:text-white mb-4">Featured Projects</h2>
            <p className="text-gray-700 dark:text-gray-300">Check back soon for featured projects!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-10 bg-light dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-inter dark:text-white">Featured Projects</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-5 w-5 text-slate dark:text-slate-400" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition"
              onClick={scrollRight}
            >
              <ChevronRight className="h-5 w-5 text-slate dark:text-slate-400" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
        
        <div 
          ref={carouselRef}
          className="flex flex-nowrap gap-8 overflow-x-auto pb-6 hide-scrollbar"
        >
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project: Project) => (
              <div key={project.id} className="min-w-[350px] md:min-w-[400px] h-[550px] flex-shrink-0">
                <FeaturedProjectCard project={project} />
              </div>
            ))
          ) : (
            <div className="w-full text-center py-12">
              <p className="text-slate dark:text-slate-400">No featured projects found.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
