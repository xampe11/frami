import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import RainbowWalletButton from "../wallet/rainbow-wallet-button";
import { Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                Explore
              </span>
            </Link>
            <Link href="/create-project">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Create
              </span>
            </Link>
            {/* Founder NFT Dropdown */}
            <div className="relative">
              <div className="flex items-center cursor-pointer text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium group">
                <span className="px-1 py-1">Founder</span>
                <ChevronDown className="h-4 w-4 ml-1 transition-transform group-hover:rotate-180" />
                
                {/* Dropdown Menu - positioned to appear only on text hover */}
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-[9999] pointer-events-none group-hover:pointer-events-auto">
                  <div className="py-2">
                    <Link href="/founder-nft">
                      <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary transition-colors">
                        NFT Sale
                      </div>
                    </Link>
                    <Link href="/founder-nft/dashboard">
                      <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary transition-colors">
                        Dashboard
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/docs">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Docs
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                Contact
              </span>
            </Link>
          </nav>

          {/* Right Side - Theme Toggle & Wallet Connection */}
          <div className="hidden md:flex items-center space-x-3">
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
            {/* Founder NFT Mobile Dropdown */}
            <div className="space-y-1">
              <div className="text-slate-700 dark:text-slate-300 font-medium py-2">
                Founder NFT
              </div>
              <div className="pl-4 space-y-2">
                <Link href="/founder-nft">
                  <span className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors block py-1 text-sm">
                    Sale
                  </span>
                </Link>
                <Link href="/founder-nft/dashboard">
                  <span className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors block py-1 text-sm">
                    Dashboard
                  </span>
                </Link>
              </div>
            </div>
            <Link href="/docs">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Docs
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors block py-2">
                Contact
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
