import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import founderNftVideo from "../../assets/videos/FounderNFT.mp4";

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
      <div className="container mx-auto px-4 sm:px-6 max-w-[110rem]">
        <div className="flex flex-col md:flex-row items-center">
          <div ref={textRef} className="w-full md:w-1/2 mb-10 md:mb-0 pr-0 md:pr-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-black dark:text-white">Fund the future with </span>
              <span className="text-primary font-extrabold">blockchain</span>
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-lg md:text-xl mb-8 font-medium">
              Frami helps bring creative projects to life with transparency, security, and global access through blockchain technology.
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
            <div className="relative rounded-xl overflow-hidden shadow-xl bg-gradient-to-r from-[#130F40] to-[#000428] border border-primary/20 max-w-[480px] mx-auto">
              {/* FounderNFT Promotional Banner */}
              <div className="pt-12 pb-8 px-8 relative">
                {/* Background Decorative Elements */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/40 rounded-full blur-3xl opacity-20"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-20"></div>
                </div>
                
                {/* Content Container */}
                <div className="flex flex-col items-center relative z-10">
                  {/* Limited Availability Tag */}
                  <div className="text-primary/80 uppercase text-xs font-medium mb-6">LIMITED AVAILABILITY</div>
                  
                  {/* Card and Text Layout */}
                  <div className="flex flex-col md:flex-row items-center md:items-start mb-6">
                    {/* Founder NFT Card */}
                    <div className="w-28 h-28 md:w-32 md:h-32 mr-0 md:mr-6 mb-4 md:mb-0 relative z-10">
                      <video
                        src={founderNftVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                        onLoadedData={(e) => {
                          e.currentTarget.playbackRate = 0.5;
                        }}
                      />
                    </div>
                    
                    {/* Text Content */}
                    <div className="text-center md:text-left">
                      <h3 className="text-white text-2xl md:text-3xl font-bold mb-2 leading-tight">Founder NFT<br/>Pre-Sale Now Live</h3>
                      <p className="text-gray-300 text-sm mb-4">Become a founding member with<br/>exclusive benefits and rewards.</p>
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium rounded-md shadow-lg">
                        <Link href="/founder-nft">Join Now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Bar */}
              <div className="w-full py-2 px-6 flex items-center justify-between bg-black/30 border-t border-primary/20">
                <div className="flex items-center">
                  <div className="text-white font-medium text-sm">
                    <span className="text-primary">750</span>/1000 Minted
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-white text-xs">
                    <span className="font-medium">Price:</span> 0.1 ETH
                  </div>
                  <div className="text-white text-xs">
                    <span className="font-medium">Ends in:</span> 14 days
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div ref={floatingRef1} className="absolute -top-8 -right-8 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg rotate-3 hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Exclusive</p>
                  <p className="text-sm font-bold text-black dark:text-white">Governance Rights</p>
                </div>
              </div>
            </div>
            
            <div ref={floatingRef2} className="absolute -bottom-8 -left-8 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg -rotate-3 hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="bg-secondary/10 dark:bg-secondary/20 p-2 rounded-full">
                  <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Earn</p>
                  <p className="text-sm font-bold text-black dark:text-white">Fee Distribution</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
