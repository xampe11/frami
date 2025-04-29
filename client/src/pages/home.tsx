import { useEffect } from "react";
import Hero from "@/components/home/hero";
import Categories from "@/components/home/categories";
import FeaturedProjects from "@/components/home/featured-projects";
import BlockchainFeatures from "@/components/home/blockchain-features";
import TrendingProjects from "@/components/home/trending-projects";
import CreateProjectCTA from "@/components/home/create-project-cta";
import HowItWorks from "@/components/home/how-it-works";
import Newsletter from "@/components/home/newsletter";
import gsap from "gsap";

const Home = () => {
  useEffect(() => {
    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    animateElements.forEach(element => {
      gsap.fromTo(element, 
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: element as Element,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
    
    return () => {
      // Clean up ScrollTrigger instances when component unmounts
      gsap.context(() => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      });
    };
  }, []);

  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProjects />
      <BlockchainFeatures />
      <TrendingProjects />
      <CreateProjectCTA />
      <HowItWorks />
      <Newsletter />
    </>
  );
};

export default Home;
