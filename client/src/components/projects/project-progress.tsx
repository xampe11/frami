import { calculateProgress, formatCurrency, getProjectStatusClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProjectProgressProps {
  raisedAmount: number;
  goalAmount: number;
  showAmounts?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProjectProgress({
  raisedAmount,
  goalAmount,
  showAmounts = false,
  size = "md",
  className
}: ProjectProgressProps) {
  const progress = calculateProgress(raisedAmount, goalAmount);
  const statusClass = getProjectStatusClass(progress);
  
  const heightClass = size === "sm" ? "h-1" : size === "lg" ? "h-2" : "h-1.5";
  const textSizeClass = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  
  return (
    <div className={cn("w-full", className)}>
      {showAmounts && (
        <div className={`flex justify-between ${textSizeClass} mb-1`}>
          <span className="font-medium">{formatCurrency(raisedAmount)} raised</span>
          <span className={`font-bold ${statusClass}`}>{progress}%</span>
        </div>
      )}
      
      <div className={`progress-bar bg-gray-100 ${heightClass}`}>
        <div 
          className={`bg-secondary h-full`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {showAmounts && size !== "sm" && (
        <div className="flex justify-between text-xs mt-1 text-slate-500">
          <span>{formatCurrency(raisedAmount)}</span>
          <span>Goal: {formatCurrency(goalAmount)}</span>
        </div>
      )}
    </div>
  );
}
