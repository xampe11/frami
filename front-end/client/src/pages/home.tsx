import { useEffect, useRef, useState } from "react";
import HeroSection from "@/components/home/hero-section";
import FeaturedProjects from "@/components/home/featured-projects";
import TrendingProjects from "@/components/home/trending-projects";
import BlockchainFeatures from "@/components/home/blockchain-features";
import HowItWorks from "@/components/home/how-it-works";
import CTASection from "@/components/home/cta-section";
import { useMediaQuery } from "@/hooks/use-mobile";
import Preloader from "@/components/preloader";

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // Apply default visibility class to ensure content is visible by default
  useEffect(() => {
    // Make content visible immediately
    document.documentElement.classList.add('content-visible');
    
    // Mark as loaded after a short delay to allow DOM to render
    const timer = setTimeout(() => {
      setContentLoaded(true);
      document.documentElement.classList.add('content-loaded');
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Set the document title
    document.title = "RealWorld Projects | Blockchain Crowdfunding";
    
    // Ensure all content is visible by adding explicit styles
    if (pageRef.current) {
      const allElements = pageRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button, a, div, img');
      allElements.forEach(el => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
    }
    
    // Since scrollTo isn't automatically available in GSAP
    // we'll use standard browser scrolling for anchor links
    const handleAnchorClick = (e: Event) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLAnchorElement;
      const targetId = target.getAttribute('href');
      
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offset = 80; // header height offset
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    };
    
    // Add event listeners to anchor links
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });
    
    // Preload GSAP to ensure it's available for all components
    const preloadGSAP = async () => {
      try {
        await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger')
        ]);
        console.log("GSAP preloaded for homepage");
      } catch (error) {
        console.error("Failed to preload GSAP:", error);
      }
    };
    
    preloadGSAP();
    
    // Clean up function
    return () => {
      anchors.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
      
      // Remove classes
      document.documentElement.classList.remove('content-visible');
      document.documentElement.classList.remove('content-loaded');
    };
  }, [isMobile]);

  return (
    <div ref={pageRef} className="opacity-100">
      {/* Show preloader only on initial load */}
      {!contentLoaded && <Preloader />}
      
      <HeroSection />
      <FeaturedProjects />
      <TrendingProjects />
      <BlockchainFeatures />
      <HowItWorks />
      <CTASection />
    </div>
  );
}
