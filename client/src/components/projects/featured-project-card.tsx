import { Link } from "wouter";
import { Project } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookmarkIcon, ExternalLink } from "lucide-react";
import { formatDistance } from "date-fns";

interface FeaturedProjectCardProps {
  project: Project;
}

export default function FeaturedProjectCard({ project }: FeaturedProjectCardProps) {
  // Calculate funding percentage
  const fundingPercentage = Math.min(
    Math.round((project.raisedAmount / project.goalAmount) * 100),
    100
  );

  // Format the date to display as "X days left" or "Ended X days ago"
  const timeLeft = formatDistance(
    new Date(project.endDate), 
    new Date(), 
    { addSuffix: true }
  );

  return (
    <div className="featured-project bg-white rounded-xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300">
      <div className="overflow-hidden h-64">
        <img 
          src={project.thumbnailUrl} 
          alt={project.title} 
          className="featured-project-img w-full"
        />
      </div>
      
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Badge className="mb-2 bg-secondary hover:bg-secondary/90">
              {project.category?.name || "Technology"}
            </Badge>
            <h3 className="text-xl font-bold font-inter">{project.title}</h3>
          </div>
          <button className="text-gray-400 hover:text-primary transition-colors">
            <BookmarkIcon size={20} />
            <span className="sr-only">Save project</span>
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-6 line-clamp-2">
          {project.description}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">${project.raisedAmount.toLocaleString()}</span>
            <span className="text-gray-500">{fundingPercentage}% of ${project.goalAmount.toLocaleString()}</span>
          </div>
          <Progress value={fundingPercentage} className="h-1.5" />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={project.creator?.avatarUrl || "https://github.com/shadcn.png"} 
              alt={project.creator?.username || "Creator"} 
              className="h-8 w-8 rounded-full mr-2"
            />
            <div>
              <p className="text-xs text-gray-500">Created by</p>
              <p className="text-sm font-medium">{project.creator?.username || "Anonymous"}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">Time left</p>
            <p className="text-sm font-medium">{timeLeft}</p>
          </div>
        </div>
        
        <Link href={`/projects/${project.slug}`}>
          <a className="absolute inset-0" aria-label={`View ${project.title}`}>
            <span className="sr-only">View project</span>
          </a>
        </Link>
      </div>
    </div>
  );
}