import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import RainbowWalletButton from '../wallet/rainbow-wallet-button';
import { Menu, X, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md py-3' 
          : 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Project Name */}
          <Link href="/">
            <div className="flex items-center cursor-pointer py-1">
              <span className="text-[#8A63D2] font-bold text-2xl">FRAMI</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
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
          </nav>

          {/* Right Side - Search, Theme Toggle & Wallet Connection */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Search className="h-5 w-5" />
            </Button>
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