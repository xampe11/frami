import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project, Category, User } from "@shared/schema";
import { BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectProgress from "./project-progress";
import { calculateProgress, formatCurrency } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
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

  const progress = calculateProgress(project.raisedAmount, project.goalAmount);

  return (
    <div className="project-card bg-white rounded-xl overflow-hidden shadow-card hover:shadow-hover transition duration-300">
      <Link href={`/projects/${project.slug}`}>
        <div className="overflow-hidden h-48">
          <img 
            src={project.thumbnailUrl} 
            alt={project.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      </Link>
      
      <div className="p-5">
        {category && (
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full uppercase font-medium">
            {category.name}
          </span>
        )}
        
        <Link href={`/projects/${project.slug}`}>
          <h3 className="text-lg font-bold mt-2 font-inter line-clamp-1 hover:text-primary transition-colors">
            {project.title}
          </h3>
        </Link>
        
        <p className="text-slate text-sm mt-2 mb-3 line-clamp-2">
          {project.description}
        </p>
        
        <div className="mb-3">
          <ProjectProgress 
            raisedAmount={project.raisedAmount}
            goalAmount={project.goalAmount} 
            showAmounts 
            size="sm"
          />
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center">
            {creator?.avatarUrl && (
              <img 
                src={creator.avatarUrl} 
                alt={creator.username} 
                className="h-6 w-6 rounded-full mr-2"
              />
            )}
            <span className="font-medium">{creator?.username || 'Unknown creator'}</span>
          </div>
          <span className="text-slate">{project.daysLeft} days left</span>
        </div>
      </div>
    </div>
  );
}
