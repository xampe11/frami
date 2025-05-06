import { useEffect, RefObject, useState } from "react";

// Track if GSAP has been loaded globally
let gsapPreloaded = false;

// Use a singleton approach for GSAP imports to avoid multiple imports
let gsapInstance: any = null;
let ScrollTriggerInstance: any = null;

/**
 * Helper function to safely load GSAP and ScrollTrigger once
 */
const loadGsapSingleton = async (): Promise<{ gsap: any, ScrollTrigger: any }> => {
  if (!gsapInstance || !ScrollTriggerInstance) {
    try {
      const [gsapModule, scrollTriggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger')
      ]);
      
      gsapInstance = gsapModule.default || gsapModule;
      ScrollTriggerInstance = scrollTriggerModule.ScrollTrigger;
      
      // Register ScrollTrigger with GSAP
      if (!gsapPreloaded) {
        gsapInstance.registerPlugin(ScrollTriggerInstance);
        gsapPreloaded = true;
      }
    } catch (error) {
      console.error("Error loading GSAP:", error);
      throw error;
    }
  }
  
  return { gsap: gsapInstance, ScrollTrigger: ScrollTriggerInstance };
};

/**
 * Hook to create reveal animations using GSAP when elements enter the viewport
 */
export function useGsapReveal(sectionRef: RefObject<HTMLElement>, delay: number = 0.1) {
  // Track loading state to ensure animations run only after GSAP is ready
  const [isGsapLoaded, setIsGsapLoaded] = useState(gsapPreloaded);
  
  // First ensure elements are visible by default
  useEffect(() => {
    // Make sure content is visible immediately in case animations fail or are slow to initialize
    if (sectionRef.current) {
      // Set a class on the element to ensure CSS defaults are applied
      sectionRef.current.classList.add('content-visible');
      
      // Ensure everything is visible by default with inline styles as backup
      const elementsToAnimate = sectionRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button, a.btn, .btn, .card, .project-card, .featured-project, img');
      elementsToAnimate.forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
        (el as HTMLElement).classList.add('animated-element');
      });
    }
  }, [sectionRef]);
  
  // Then initialize animations after GSAP is loaded
  useEffect(() => {
    let cleanupFunction: (() => void) | undefined;
    
    // Preload GSAP if needed
    if (!isGsapLoaded) {
      loadGsapSingleton()
        .then(() => {
          setIsGsapLoaded(true);
        })
        .catch(error => {
          console.error("Failed to preload GSAP:", error);
        });
    }
    
    const initGsap = async () => {
      try {
        if (typeof window !== "undefined" && sectionRef.current) {
          // Use the singleton GSAP instance
          const { gsap, ScrollTrigger } = await loadGsapSingleton();
          
          // Animate heading, paragraphs and other elements
          const headings = sectionRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const paragraphs = sectionRef.current.querySelectorAll('p');
          const buttons = sectionRef.current.querySelectorAll('button, a.btn, .btn');
          const cards = sectionRef.current.querySelectorAll('.card, .project-card, .featured-project');
          const images = sectionRef.current.querySelectorAll('img');
          
          // Create a cleanup function
          const triggers: any[] = [];
          
          // Headings come in from bottom with stagger
          if (headings.length > 0) {
            const tl = gsap.from(headings, {
              y: 20,
              opacity: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
              },
              delay
            });
            triggers.push(tl);
          }
          
          // Paragraphs fade in
          if (paragraphs.length > 0) {
            const tl = gsap.from(paragraphs, {
              opacity: 0,
              y: 15,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
              },
              delay: delay + 0.1
            });
            triggers.push(tl);
          }
          
          // Buttons scale and fade in
          if (buttons.length > 0) {
            const tl = gsap.from(buttons, {
              scale: 0.95,
              opacity: 0,
              duration: 0.4,
              stagger: 0.1,
              ease: "back.out(1.5)",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
              },
              delay: delay + 0.2
            });
            triggers.push(tl);
          }
          
          // Cards fade in and rise with stagger
          if (cards.length > 0) {
            const tl = gsap.from(cards, {
              y: 30,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: cards[0],
                start: "top 90%",
              },
              delay: delay + 0.15
            });
            triggers.push(tl);
          }
          
          // Images fade in and scale
          if (images.length > 0) {
            const tl = gsap.from(images, {
              opacity: 0,
              scale: 0.97,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%",
              },
              delay: delay + 0.1
            });
            triggers.push(tl);
          }
          
          // Define cleanup function to kill all ScrollTriggers
          cleanupFunction = () => {
            // Using explicit any type since ScrollTrigger types aren't readily available
            const allTriggers = ScrollTrigger.getAll();
            for (let i = 0; i < allTriggers.length; i++) {
              allTriggers[i].kill();
            }
            
            // Clear all timelines
            triggers.forEach(tl => tl.kill());
          };
        }
      } catch (error) {
        console.error("Error initializing GSAP animations:", error);
        // Ensure content is visible even if animations fail
        if (sectionRef.current) {
          const elementsToAnimate = sectionRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button, a.btn, .btn, .card, .project-card, .featured-project, img');
          elementsToAnimate.forEach(el => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.transform = 'none';
          });
        }
      }
    };
    
    // Initialize GSAP animations
    initGsap();
    
    // Return cleanup function
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [sectionRef, delay]);
}
