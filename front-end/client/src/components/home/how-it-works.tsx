import { useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Lightbulb, Wallet, Users, Rocket } from "lucide-react";
import { useGsapReveal } from "@/hooks/use-gsap";

interface StepCardProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function StepCard({ number, icon, title, description }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="bg-primary/10 dark:bg-primary/20 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4 relative">
        <span className="absolute -top-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
          {number}
        </span>
        {icon}
      </div>
      <h3 className="text-lg font-bold font-inter mb-2 dark:text-white">
        {title}
      </h3>
      <p className="text-slate dark:text-slate-300 text-sm">{description}</p>
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useGsapReveal(sectionRef);

  const steps = [
    {
      number: 1,
      icon: <Wallet className="h-6 w-6 text-primary" />,
      title: "Connect Wallet",
      description:
        "Link your cryptocurrency wallet to receive and manage project funds securely.",
    },
    {
      number: 2,
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
      title: "Create Your Project",
      description:
        "Define your project goals, funding targets, and milestone deliverables.",
    },
    {
      number: 3,
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Attract Backers",
      description:
        "Share your project and engage with the global community of potential backers.",
    },
    {
      number: 4,
      icon: <Rocket className="h-6 w-6 text-primary" />,
      title: "Build & Deliver",
      description:
        "As milestones are reached, smart contracts release funds automatically to continue development.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-16 bg-light dark:bg-slate-900"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-[90rem]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-inter mb-4 dark:text-white">
            How It Works
          </h2>
          <p className="text-slate dark:text-slate-300 max-w-2xl mx-auto">
            A simple process to bring your ideas to life with the power of
            blockchain technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <StepCard
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Button
            asChild
            variant="outline"
            className="inline-flex items-center bg-white dark:bg-slate-800 border border-primary dark:border-primary/70 text-primary dark:text-primary-light hover:bg-primary hover:text-white dark:hover:bg-primary/80 font-medium py-3 px-6 rounded-lg transition duration-150"
          >
            <Link href="/create-project">
              Start Your Project
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
