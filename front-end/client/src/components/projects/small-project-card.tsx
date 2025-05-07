import { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Project } from '@shared/schema';
import gsap from 'gsap';

interface SmallProjectCardProps {
  project: Project;
}

const SmallProjectCard: React.FC<SmallProjectCardProps> = ({ project }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const card = cardRef.current;
    
    if (!card) return;
    
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -5,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        duration: 0.3,
        ease: 'power2.out'
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
        duration: 0.3,
        ease: 'power2.out'
      });
    };
    
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  const fundingPercentage = Math.min(
    Math.round((project.currentFunding / project.fundingGoal) * 100),
    100
  );
  
  return (
    <div 
      ref={cardRef}
      className="project-card bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl border border-gray-200 dark:border-slate-700 transition-all duration-300"
    >
      {new Date(project.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && 
        <span className="badge-new text-xs">New</span>}
      {project.trending && <span className="badge-trending text-xs">Trending</span>}
      
      <Link href={`/projects/${project.slug}`}>
        <div className="block cursor-pointer">
          <div className="aspect-w-16 aspect-h-10 overflow-hidden">
            <img 
              src={project.thumbnailUrl} 
              alt={project.title} 
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105" 
            />
          </div>
          
          <div className="p-4">
            <h3 className="font-heading font-bold text-base mb-1 truncate text-black dark:text-white">{project.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-1">{project.shortDescription}</p>
            
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-black dark:text-white">{fundingPercentage}% funded</span>
                <span className="font-medium text-black dark:text-white">{project.currentFunding} {project.fundingCurrency}</span>
              </div>
              <div className="progress-bar bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-secondary h-full rounded-full" 
                  style={{ width: `${fundingPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 font-medium">
              <span>{project.backerCount} backers</span>
              <span>{project.daysRemaining} days left</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SmallProjectCard;
