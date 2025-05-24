import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import RainbowWalletButton from "../wallet/rainbow-wallet-button";
import { Menu, X, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch projects for search
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isSearchOpen, // Only fetch when search is open
  });

  // Filter projects based on search query
  const filteredProjects = projects?.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md py-3"
          : "bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-[110rem]">
        <div className="flex justify-between items-center">
          {/* Project Name */}
          <Link href="/">
            <div className="flex items-center cursor-pointer py-1">
              <span className="text-[#8A63D2] font-bold text-4xl md:text-4xl">
                FRAMI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Home
              </span>
            </Link>
            <Link href="/explore">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Explore Projects
              </span>
            </Link>
            <Link href="/create-project">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Start a Project
              </span>
            </Link>
            <Link href="/founder-nft">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Founder NFT
              </span>
            </Link>
            <Link href="/docs">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Docs
              </span>
            </Link>
          </nav>

          {/* Right Side - Search, Theme Toggle & Wallet Connection */}
          <div className="hidden md:flex items-center space-x-3">
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Search Projects</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search for projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {isLoading ? (
                      // Loading skeleton
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))
                    ) : filteredProjects.length > 0 ? (
                      // Search results
                      filteredProjects.map((project) => (
                        <Link key={project.id} href={`/project/${project.slug}`}>
                          <div 
                            className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <h3 className="font-semibold text-sm mb-1">{project.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                              <span>Goal: {project.fundingGoal} ETH</span>
                              <span>Raised: {project.currentFunding} ETH</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : searchQuery.trim() ? (
                      // No results found
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No projects found for "{searchQuery}"</p>
                        <p className="text-xs mt-1">Try searching with different keywords</p>
                      </div>
                    ) : (
                      // Empty state
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Start typing to search for projects</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
            <RainbowWalletButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-lg mt-3 py-4 px-6 absolute w-full">
          <nav className="flex flex-col space-y-4">
            <Link href="/">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Home
              </span>
            </Link>
            <Link href="/explore">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Explore Projects
              </span>
            </Link>
            <Link href="/create-project">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Start a Project
              </span>
            </Link>
            <Link href="/founder-nft">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Founder NFT
              </span>
            </Link>
            <Link href="/docs">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Docs
              </span>
            </Link>
            <div className="pt-2 flex items-center space-x-2">
              <ThemeToggle />
              <RainbowWalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
