import { SVGProps } from 'react';

export function FramiLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M29 14.5858V25.4142L20 30.8284L11 25.4142V14.5858L20 9.17157L29 14.5858Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      <path 
        d="M20 20V30.8284M20 20L11 14.5858M20 20L29 14.5858M20 9.17157L29 14.5858M11 14.5858V25.4142" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
    </svg>
  );
}

export function FramiTextLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${props.className || ''}`}>
      <FramiLogo className="h-9 w-9" />
      <span className="font-sans font-medium text-2xl">FRAMI</span>
    </div>
  );
}