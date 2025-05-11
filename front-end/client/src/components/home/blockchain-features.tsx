import { useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Lock, Globe, FileText } from 'lucide-react';
import { useGsapReveal } from "@/hooks/use-gsap";

interface FeatureCardProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, color, title, description }: FeatureCardProps) {
  const bgColorClasses = {
    primary: "bg-indigo-100 dark:bg-indigo-900/30",
    secondary: "bg-cyan-100 dark:bg-cyan-900/30",
    accent: "bg-pink-100 dark:bg-pink-900/30"
  };
  
  const bgClass = bgColorClasses[color as keyof typeof bgColorClasses] || bgColorClasses.primary;
  
  return (
    <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-4 ${bgClass}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold font-inter mb-3 text-slate-800 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

export default function BlockchainFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useGsapReveal(sectionRef);
  
  const features = [
    {
      icon: <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      color: "primary",
      title: "Transparent & Secure",
      description: "All transactions and funding milestones are recorded on the blockchain, providing complete transparency and immutable proof of funding activity."
    },
    {
      icon: <Globe className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />,
      color: "secondary",
      title: "Global Access",
      description: "Anyone with an internet connection and cryptocurrency can participate, removing geographical restrictions and banking limitations."
    },
    {
      icon: <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />,
      color: "accent",
      title: "Smart Contracts",
      description: "Automated smart contracts ensure funds are only released when predetermined project milestones are reached, protecting both creators and backers."
    }
  ];

  return (
    <section ref={sectionRef} className="py-16 bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-[110rem]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-inter mb-4 dark:text-white">Why Blockchain Crowdfunding?</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
            Our platform leverages blockchain technology to provide unmatched transparency, 
            security, and global accessibility for all your projects.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              color={feature.color} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button 
            asChild
            className="inline-flex items-center bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition duration-150"
          >
            <Link href="/explore">
              Learn More About Blockchain
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
