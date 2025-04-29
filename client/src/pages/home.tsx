import { useEffect, useRef } from "react";
import HeroSection from "@/components/home/hero-section";
import CategoryNavigation from "@/components/home/category-navigation";
import FeaturedProjects from "@/components/home/featured-projects";
import TrendingProjects from "@/components/home/trending-projects";
import BlockchainFeatures from "@/components/home/blockchain-features";
import HowItWorks from "@/components/home/how-it-works";
import CTASection from "@/components/home/cta-section";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  useEffect(() => {
    const initAnimation = async () => {
      if (typeof window !== "undefined") {
        const { gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        
        gsap.registerPlugin(ScrollTrigger);
        
        if (!isMobile) {
          // Smooth scroll animation for anchor links
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
              e.preventDefault();
              
              const targetId = this.getAttribute('href');
              if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                  gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                      y: targetElement,
                      offsetY: 80
                    },
                    ease: "power2.inOut"
                  });
                }
              }
            });
          });
        }
      }
    };
    
    initAnimation();
    
    // Set the document title
    document.title = "RealWorld Projects | Blockchain Crowdfunding";
    
    return () => {
      // Clean up any listeners or animations
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', function() {});
      });
    };
  }, [isMobile]);

  return (
    <div ref={pageRef}>
      <HeroSection />
      <CategoryNavigation />
      <FeaturedProjects />
      <TrendingProjects />
      <BlockchainFeatures />
      <HowItWorks />
      <CTASection />
    </div>
  );
}
