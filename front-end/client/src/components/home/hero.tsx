import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import gsap from 'gsap';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const heroElement = heroRef.current;
    
    if (!heroElement) return;
    
    const tl = gsap.timeline();
    
    tl.from(heroElement.querySelector('h1'), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(heroElement.querySelector('p'), {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4")
    .from(heroElement.querySelectorAll('.hero-button'), {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.2,
      ease: "power3.out"
    }, "-=0.4");
    
    return () => {
      tl.kill();
    };
  }, []);
  
  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-primary/10 -top-[400px] -left-[400px]"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full bg-secondary/10 -bottom-[300px] -right-[300px]"></div>
      </div>
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
            <span className="text-gradient">Fund Projects On The Blockchain</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10">
            Discover and fund innovative real-world projects with the transparency and efficiency of blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/explore">
              <a className="hero-button btn-primary">
                Explore Projects
              </a>
            </Link>
            <Link href="/create-project">
              <a className="hero-button btn-secondary">
                Start a Project
              </a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
