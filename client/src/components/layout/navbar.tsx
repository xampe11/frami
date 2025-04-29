import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import CustomConnectWalletButton from '../custom-connect-wallet';
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
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#9376FF] transition-colors`}>
                Real World Projects
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/explore">
              <span className="text-slate-700 hover:text-primary transition-colors">
                Explore
              </span>
            </Link>
            <Link href="/create-project">
              <span className="text-slate-700 hover:text-primary transition-colors">
                Start a Project
              </span>
            </Link>
            <Link href="/discover">
              <span className="text-slate-700 hover:text-primary transition-colors">
                Discover
              </span>
            </Link>
          </nav>

          {/* Right Side - Search & Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-slate-700">
              <Search className="h-5 w-5" />
            </Button>
            <CustomConnectWalletButton />
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
              <CustomConnectWalletButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}