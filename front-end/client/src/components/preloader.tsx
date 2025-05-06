import { useEffect, useState } from 'react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pre-load GSAP asynchronously
    const preloadGSAP = async () => {
      try {
        await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger')
        ]);
        
        // Add a slight delay to allow components to render
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      } catch (error) {
        console.error('Failed to preload GSAP:', error);
        // If loading fails, don't keep the user waiting
        setIsLoading(false);
      }
    };

    preloadGSAP();
    
    // Apply default visibility to ensure content appears
    document.documentElement.classList.add('content-visible');
    
    return () => {
      // Remove the class when unmounting
      document.documentElement.classList.remove('content-loaded');
    };
  }, []);

  // Hide preloader once loading is complete
  useEffect(() => {
    if (!isLoading) {
      document.documentElement.classList.add('content-loaded');
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center transition-opacity duration-300 fade-out">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-foreground/80 animate-pulse">Loading amazing content...</p>
      </div>
    </div>
  );
}