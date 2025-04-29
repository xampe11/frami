import { useRef, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useGsapReveal } from "@/hooks/use-gsap";

export default function CTASection() {
  const [email, setEmail] = useState('');
  const sectionRef = useRef<HTMLElement>(null);
  const { toast } = useToast();
  
  useGsapReveal(sectionRef);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email is required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive"
      });
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send the email to a server
    toast({
      title: "Thanks for subscribing!",
      description: "You'll receive updates about new projects soon.",
    });
    setEmail('');
  };

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:max-w-xl">
            <h2 className="text-3xl font-bold font-inter mb-4">Ready to Launch Your Project?</h2>
            <p className="mb-6">
              Join thousands of creators who have successfully funded their projects using our 
              blockchain-powered platform. No middlemen, no hidden fees, just pure creativity and innovation.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                asChild
                className="bg-white text-primary hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition duration-150 text-center"
              >
                <Link href="/create">Start a Project</Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="bg-transparent border border-white text-white hover:bg-white/10 font-medium py-3 px-6 rounded-lg transition duration-150 text-center"
              >
                <Link href="/explore">Explore Projects</Link>
              </Button>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl max-w-md">
              <h3 className="text-xl font-bold font-inter mb-4">Subscribe for Updates</h3>
              <p className="text-white/80 mb-4 text-sm">
                Get the latest projects and platform news delivered to your inbox.
              </p>
              <form onSubmit={handleSubscribe}>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2">
                  <Input 
                    type="email" 
                    placeholder="Your email address" 
                    className="bg-white/20 border border-white/30 text-white placeholder:text-white/60 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 flex-grow"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    className="bg-white text-primary hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition duration-150 whitespace-nowrap"
                  >
                    Subscribe
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
