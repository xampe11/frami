import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import gsap from 'gsap';

const CreateProjectCTA = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const section = sectionRef.current;
    
    if (!section) return;
    
    gsap.from(section.querySelector('h2'), {
      opacity: 0,
      y: 20,
      duration: 0.8,
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
      }
    });
    
    gsap.from(section.querySelector('p'), {
      opacity: 0,
      y: 20,
      duration: 0.8,
      delay: 0.2,
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
      }
    });
    
    gsap.from(section.querySelector('a'), {
      opacity: 0,
      y: 20,
      duration: 0.8,
      delay: 0.4,
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
      }
    });
  }, []);
  
  return (
    <section ref={sectionRef} className="py-16 gradient-bg text-white animate-on-scroll">
      <div className="container mx-auto px-4 sm:px-6 max-w-[90rem]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-heading mb-6">Launch Your Project on Blockchain</h2>
          <p className="text-lg mb-8 opacity-90">
            Get your creative or innovative idea funded with the power and security of blockchain technology.
          </p>
          <Link href="/create-project">
            <span className="inline-block btn-primary bg-white text-primary hover:bg-gray-100 font-medium rounded-full px-8 py-3 shadow-lg">
              Start Your Project
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CreateProjectCTA;
