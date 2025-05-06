import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Category } from "@shared/schema";
import { ChevronRight, PaintbrushVertical, Cpu, Leaf, Gamepad, Film, Music, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { cn, getCategoryIcon } from "@/lib/utils";
import { useGsapReveal } from "@/hooks/use-gsap";

export default function CategoryNavigation() {
  const [activeCategory, setActiveCategory] = useState<string | null>("all");
  const sectionRef = useRef<HTMLElement>(null);
  
  useGsapReveal(sectionRef);
  
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const handleCategoryClick = (category: string | null) => {
    setActiveCategory(category);
  };

  // Map category icon to Lucide component
  const getCategoryIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'paintbrush': <PaintbrushVertical className="h-4 w-4" />,
      'microchip': <Cpu className="h-4 w-4" />,
      'leaf': <Leaf className="h-4 w-4" />,
      'gamepad': <Gamepad className="h-4 w-4" />,
      'film': <Film className="h-4 w-4" />,
      'music': <Music className="h-4 w-4" />,
      'book': <BookOpen className="h-4 w-4" />
    };
    
    return iconMap[iconName] || null;
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48 dark:bg-slate-700" />
            <Skeleton className="h-6 w-32 dark:bg-slate-700" />
          </div>
          <div className="flex overflow-x-auto pb-4 space-x-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-8 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-inter dark:text-white">Explore Categories</h2>
          <Link 
            href="/explore" 
            className="text-primary font-medium text-sm flex items-center hover:underline"
          >
            View all categories
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto pb-4 hide-scrollbar space-x-3">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            className={cn(
              "whitespace-nowrap rounded-full text-sm font-medium transition",
              activeCategory === "all" 
                ? "bg-primary text-white" 
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            )}
            onClick={() => handleCategoryClick("all")}
          >
            All Projects
          </Button>
          
          {categories.map((category: Category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.slug ? "default" : "outline"}
              size="sm"
              className={cn(
                "whitespace-nowrap rounded-full text-sm font-medium transition flex items-center",
                activeCategory === category.slug 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              )}
              onClick={() => handleCategoryClick(category.slug)}
            >
              {getCategoryIconComponent(category.icon)}
              <span className="ml-1">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
