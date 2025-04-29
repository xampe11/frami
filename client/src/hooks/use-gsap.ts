import { useEffect, RefObject } from 'react';

/**
 * A hook to handle GSAP reveal animations for elements
 * @param elementRef - React ref object pointing to the element to animate
 * @param options - Animation options
 */
export function useGsapReveal(
  elementRef: RefObject<HTMLElement>,
  options = {
    y: 30,
    opacity: 0,
    duration: 0.8,
    staggerChildren: 0.1,
    childSelector: '.animate-item',
    start: 'top 85%',
  }
) {
  useEffect(() => {
    const initAnimation = async () => {
      if (typeof window !== 'undefined' && elementRef.current) {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        
        gsap.registerPlugin(ScrollTrigger);
        
        // Main element reveal animation
        gsap.fromTo(
          elementRef.current,
          { opacity: 0, y: options.y },
          {
            opacity: 1,
            y: 0,
            duration: options.duration,
            scrollTrigger: {
              trigger: elementRef.current,
              start: options.start,
              toggleActions: 'play none none none',
            },
          }
        );
        
        // Staggered children animation if children exist
        const children = elementRef.current.querySelectorAll(options.childSelector);
        if (children.length > 0) {
          gsap.fromTo(
            children,
            { opacity: 0, y: options.y / 2 },
            {
              opacity: 1,
              y: 0,
              duration: options.duration * 0.8,
              stagger: options.staggerChildren,
              scrollTrigger: {
                trigger: elementRef.current,
                start: options.start,
                toggleActions: 'play none none none',
              },
            }
          );
        }
      }
    };
    
    initAnimation();
    
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        // Import needs to be in a try/catch because it's async
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
          ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars.trigger === elementRef.current) {
              trigger.kill();
            }
          });
        }).catch(console.error);
      }
    };
  }, [elementRef, options]);
}