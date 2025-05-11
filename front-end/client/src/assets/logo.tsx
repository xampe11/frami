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
        d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
      />
      <path 
        d="M20 3L35 11.5M20 19.5V37M20 19.5L5 11.5M20 19.5L35 11.5M5 11.5V28.5M35 28.5V11.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
      />
    </svg>
  );
}

export function FramiTextLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${props.className || ''}`}>
      <FramiLogo className="h-8 w-8" />
      <span className="font-sans font-bold text-2xl tracking-wider">FRAMI</span>
    </div>
  );
}