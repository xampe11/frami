import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project, Category, User } from "@shared/schema";
import { BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProjectProgress from "./project-progress";
import { calculateProgress, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FeaturedProjectCardProps {
  project: Project;
}

export default function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  
  // Fetch category
  const { data: category } = useQuery({
    queryKey: ['/api/categories', project.categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${project.categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch category');
      return response.json();
    },
    enabled: !!project.categoryId,
  });
  
  // Fetch creator
  const { data: creator } = useQuery({
    queryKey: ['/api/users', project.creatorId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${project.creatorId}`);
      if (!response.ok) throw new Error('Failed to fetch creator');
      return response.json();
    },
    enabled: !!project.creatorId,
  });

  const handleSaveProject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    toast({
      title: saved ? "Project removed from bookmarks" : "Project saved to bookmarks",
      description: saved ? "You can add it back anytime." : "You can find it in your saved projects.",
    });
  };

  const progress = calculateProgress(project.raisedAmount, project.goalAmount);

  return (
    <div className="featured-project bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-card hover:shadow-hover transition duration-300">
      <Link href={`/projects/${project.slug}`}>
        <div className="overflow-hidden relative">
          <img 
            src={project.thumbnailUrl || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
            alt={project.title} 
            className="featured-project-img w-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
            }}
          />
          <div className="overlay">
            <span className={`bg-${category?.slug === 'sustainability' ? 'secondary' : 'primary'}/20 text-white text-xs px-3 py-1 rounded-full uppercase font-bold`}>
              {category?.name || 'Featured'}
            </span>
            <h3>{project.title}</h3>
            <div className="w-full rounded-full h-2 bg-gray-300/30 mb-2">
              <div className="bg-secondary h-2 rounded-full" style={{width: `${progress}%`}}></div>
            </div>
            <div className="flex justify-between mt-1 text-sm text-white">
              <span className="font-bold">{formatCurrency(project.raisedAmount)} raised</span>
              <span>{formatCurrency(project.goalAmount)} goal</span>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            {category && (
              <span className={`bg-${category.slug === 'sustainability' ? 'secondary' : 'primary'}/10 text-${category.slug === 'sustainability' ? 'secondary' : 'primary'} text-xs px-3 py-1 rounded-full uppercase font-bold`}>
                {category.name}
              </span>
            )}
            <Link href={`/projects/${project.slug}`}>
              <h3 className="text-xl font-bold mt-2 mb-1 font-inter hover:text-primary transition-colors text-black dark:text-white">
                {project.title}
              </h3>
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate hover:text-primary"
            onClick={handleSaveProject}
            aria-label={saved ? "Unsave project" : "Save project"}
          >
            <BookmarkIcon className={`h-5 w-5 ${saved ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
        
        <p className="text-slate mb-4 line-clamp-3">
          {project.description}
        </p>
        
        <div className="mb-4">
          <ProjectProgress 
            raisedAmount={project.raisedAmount}
            goalAmount={project.goalAmount} 
            showAmounts
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {creator?.avatarUrl && (
              <img 
                src={creator.avatarUrl} 
                alt={creator.username} 
                className="h-8 w-8 rounded-full mr-2"
              />
            )}
            <div>
              <p className="text-xs text-slate">Created by</p>
              <p className="text-sm font-medium">{creator?.username || 'Unknown creator'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate">Time left</p>
            <p className="text-sm font-medium">{project.daysLeft} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
