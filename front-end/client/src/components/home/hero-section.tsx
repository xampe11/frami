import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const floatingRef1 = useRef<HTMLDivElement>(null);
  const floatingRef2 = useRef<HTMLDivElement>(null);
  
  // Make sure all elements are visible immediately
  useEffect(() => {
    // Ensure all content is visible by default, even before animations load
    if (textRef.current) {
      textRef.current.querySelectorAll('h1, p, div').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
    }
    
    if (imageRef.current) {
      imageRef.current.style.opacity = '1';
      imageRef.current.style.transform = 'none';
    }
    
    if (floatingRef1.current && floatingRef2.current) {
      [floatingRef1.current, floatingRef2.current].forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }
    
    // Then initialize the animations
    const initAnimation = async () => {
      try {
        if (typeof window !== "undefined") {
          const { gsap } = await import("gsap");
          
          // Animate text elements
          if (textRef.current) {
            gsap.from(textRef.current.querySelectorAll('h1, p, div'), {
              y: 20,
              opacity: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power2.out"
            });
          }
          
          // Animate image
          if (imageRef.current) {
            gsap.from(imageRef.current, {
              x: 50,
              opacity: 0,
              duration: 0.8,
              delay: 0.2,
              ease: "power2.out"
            });
          }
          
          // Animate floating elements
          if (floatingRef1.current && floatingRef2.current) {
            gsap.from([floatingRef1.current, floatingRef2.current], {
              y: 15,
              opacity: 0,
              duration: 0.6,
              stagger: 0.15,
              delay: 0.3,
              ease: "power2.out"
            });
            
            // Floating animation - gentle bobbing
            gsap.to(floatingRef1.current, {
              y: -8,
              duration: 2,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            gsap.to(floatingRef2.current, {
              y: -8,
              duration: 2.5,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: 0.3
            });
          }
        }
      } catch (error) {
        console.error("Error initializing hero animations:", error);
        // No need for fallback here since we pre-set visibility above
      }
    };
    
    // Small timeout to prioritize initial content display
    setTimeout(() => {
      initAnimation();
    }, 50);
  }, []);

  return (
    <section ref={sectionRef} className="animated-bg pt-28 md:pt-32 pb-12 md:pb-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center">
          <div ref={textRef} className="w-full md:w-1/2 mb-10 md:mb-0 pr-0 md:pr-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-black dark:text-white">Fund the future with </span>
              <span className="text-primary font-extrabold">blockchain</span>
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-lg md:text-xl mb-8 font-medium">
              Bringing creative projects to life with transparency, security, and global access through blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg">
                <Link href="/explore">Discover Projects</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border border-primary text-primary hover:bg-primary hover:text-white font-medium rounded-lg">
                <Link href="/create-project">Start a Project</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((id) => (
                  <img 
                    key={id}
                    src={`https://i.pravatar.cc/40?img=${id}`} 
                    alt={`User ${id}`} 
                    className="h-8 w-8 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <span className="text-slate-600 dark:text-slate-400">Join <span className="text-black dark:text-white font-bold">12,000+</span> creators worldwide</span>
            </div>
          </div>
          <div ref={imageRef} className="w-full md:w-1/2 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Blockchain Crowdfunding" 
                className="w-full rounded-2xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: "linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%)" }}>
                <span className="bg-secondary text-white text-xs px-3 py-1 rounded-full uppercase font-medium">Featured</span>
                <h3 className="text-white text-xl font-bold mt-2">Decentralized Innovation Hub</h3>
                <div className="flex items-center mt-3">
                  <div className="w-full bg-gray-300/30 rounded-full h-2 mr-2">
                    <div className="bg-secondary h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                  <span className="text-white font-medium text-sm">75%</span>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span style={{ color: "#FFFFFF" }}>$75,000 raised</span>
                  <span style={{ color: "#FFFFFF" }}>$100,000 goal</span>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div ref={floatingRef1} className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg rotate-3 hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Secured by</p>
                  <p className="text-sm font-bold text-black dark:text-white">Blockchain</p>
                </div>
              </div>
            </div>
            
            <div ref={floatingRef2} className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg -rotate-3 hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="bg-secondary/10 dark:bg-secondary/20 p-2 rounded-full">
                  <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Global</p>
                  <p className="text-sm font-bold text-black dark:text-white">Participation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
