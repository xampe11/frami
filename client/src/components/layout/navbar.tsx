import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Web3WalletButton from '../wallet/web3-wallet-button';
import { Menu, X, Search } from 'lucide-react';

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
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-3' : 'bg-white/70 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <span className={`text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#9376FF] transition-colors`}>
                Real World Projects
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/explore">
              <span className="text-slate-700 hover:text-primary transition-colors font-medium">
                Explore
              </span>
            </Link>
            <Link href="/create-project">
              <span className="text-slate-700 hover:text-primary transition-colors font-medium">
                Start a Project
              </span>
            </Link>
            <Link href="/discover">
              <span className="text-slate-700 hover:text-primary transition-colors font-medium">
                Discover
              </span>
            </Link>
          </nav>

          {/* Right Side - Search & Wallet Connection */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-slate-700 hover:bg-slate-100">
              <Search className="h-5 w-5" />
            </Button>
            <Web3WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
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
        <div className="md:hidden bg-white shadow-lg mt-3 py-4 px-6 absolute w-full">
          <nav className="flex flex-col space-y-4">
            <Link href="/explore">
              <span className="text-slate-700 hover:text-primary transition-colors block py-2">
                Explore
              </span>
            </Link>
            <Link href="/create-project">
              <span className="text-slate-700 hover:text-primary transition-colors block py-2">
                Start a Project
              </span>
            </Link>
            <Link href="/discover">
              <span className="text-slate-700 hover:text-primary transition-colors block py-2">
                Discover
              </span>
            </Link>
            <div className="pt-2">
              <Web3WalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}