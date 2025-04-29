import React from 'react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';

interface ProjectProgressProps {
  raisedAmount: number;
  goalAmount: number;
  showAmounts?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProjectProgress({ 
  raisedAmount, 
  goalAmount, 
  showAmounts = true,
  size = 'md'
}: ProjectProgressProps) {
  const progress = Math.min(Math.round((raisedAmount / goalAmount) * 100), 100);
  
  const progressClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div>
      {showAmounts && (
        <div className={`flex justify-between mb-1 ${textClasses[size]}`}>
          <span className="font-semibold">
            {formatCurrency(raisedAmount)}
          </span>
          <span className="text-gray-500">
            {progress}% of {formatCurrency(goalAmount)}
          </span>
        </div>
      )}
      <Progress 
        value={progress} 
        className={progressClasses[size]}
      />
    </div>
  );
}