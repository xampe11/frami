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
    // Set the document title
    document.title = "RealWorld Projects | Blockchain Crowdfunding";
    
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
    
    // Clean up function
    return () => {
      anchors.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
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
