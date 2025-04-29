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
  
  const { data: featuredProjects, isLoading } = useQuery({
    queryKey: ['/api/projects/featured'],
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
      if (typeof window !== "undefined" && featuredProjects?.length > 0) {
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
    
    if (featuredProjects?.length > 0) {
      initAnimation();
    }
  }, [featuredProjects]);

  if (isLoading) {
    return (
      <section className="py-12 bg-light">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-card">
                <Skeleton className="w-full h-64" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Skeleton className="h-5 w-20 mb-2" />
                      <Skeleton className="h-7 w-48" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-[90%] mb-6" />
                  
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-2 w-full mb-4" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-16" />
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

  if (!featuredProjects || featuredProjects.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="pt-12 pb-6 bg-light">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-inter">Featured Projects</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white rounded-full shadow-sm hover:shadow-md transition"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-5 w-5 text-slate" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white rounded-full shadow-sm hover:shadow-md transition"
              onClick={scrollRight}
            >
              <ChevronRight className="h-5 w-5 text-slate" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
        
        <div 
          ref={carouselRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-x-auto md:overflow-hidden pb-4 hide-scrollbar"
        >
          {featuredProjects.map((project: Project) => (
            <FeaturedProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
