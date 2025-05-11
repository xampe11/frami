import { SVGProps } from 'react';

export function FramiLogo(props: SVGProps<SVGSVGElement>) {
  // Final attempt with thicker strokes
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="40" 
      height="40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Hexagon outline */}
      <path
        d="M12 2L22 8V16L12 22L2 16V8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Vertical center line */}
      <path 
        d="M12 2V22" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Horizontal lines on right */}
      <path 
        d="M12 8H22" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M12 16H22" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Left side vertical lines */}
      <path 
        d="M6 5V8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M6 11V19" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Horizontal line on left */}
      <path 
        d="M6 11H8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FramiTextLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${props.className || ''}`}>
      <FramiLogo className="w-9 h-9" />
      <span className="font-sans font-medium text-xl" style={{ letterSpacing: '0.03em' }}>FRAMI</span>
    </div>
  );
}