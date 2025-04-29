import { useEffect, RefObject } from "react";

/**
 * Hook to create reveal animations using GSAP when elements enter the viewport
 */
export function useGsapReveal(sectionRef: RefObject<HTMLElement>, delay: number = 0.1) {
  useEffect(() => {
    const initGsap = async () => {
      if (typeof window !== "undefined" && sectionRef.current) {
        const { gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate heading, paragraphs and other elements
        const headings = sectionRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const paragraphs = sectionRef.current.querySelectorAll('p');
        const buttons = sectionRef.current.querySelectorAll('button, a.btn, .btn');
        const cards = sectionRef.current.querySelectorAll('.card, .project-card, .featured-project');
        const images = sectionRef.current.querySelectorAll('img');
        
        // Headings come in from bottom with stagger
        if (headings.length > 0) {
          gsap.from(headings, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
            delay
          });
        }
        
        // Paragraphs fade in
        if (paragraphs.length > 0) {
          gsap.from(paragraphs, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
            delay: delay + 0.2
          });
        }
        
        // Buttons scale and fade in
        if (buttons.length > 0) {
          gsap.from(buttons, {
            scale: 0.9,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
            delay: delay + 0.4
          });
        }
        
        // Cards fade in and rise with stagger
        if (cards.length > 0) {
          gsap.from(cards, {
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cards[0],
              start: "top 90%",
            },
            delay: delay + 0.3
          });
        }
        
        // Images fade in and scale
        if (images.length > 0) {
          gsap.from(images, {
            opacity: 0,
            scale: 0.95,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
            delay: delay + 0.2
          });
        }
        
        return () => {
          // Clean up ScrollTriggers when component unmounts
          ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
      }
    };
    
    initGsap();
  }, [sectionRef, delay]);
}
