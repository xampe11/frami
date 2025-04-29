import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Wallet, Menu } from "lucide-react";
import WalletModal from "@/components/ui/wallet-modal";
import { BlockchainLogo } from "@/assets/icons";

export default function Navbar() {
  const [location] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { isConnected, address, connect } = useWallet();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      // In a real app, this would navigate to search results
      console.log(`Searching for: ${searchInput}`);
    }
  };

  const navigation = [
    { name: "Explore", href: "/explore" },
    { name: "Start a Project", href: "/create" },
    { name: "How It Works", href: "#how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-4 px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <BlockchainLogo className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold font-space">
              RealWorld<span className="text-primary">Projects</span>
            </span>
          </Link>
          
          <div className="hidden md:flex space-x-6 ml-8">
            {navigation.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className={cn(
                  "text-slate hover:text-primary font-medium transition duration-150",
                  location === item.href && "text-primary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <form 
            onSubmit={handleSearchSubmit}
            className="search-container relative flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-2 transition-all"
          >
            <Search className="text-gray-400 h-4 w-4 mr-2" />
            <Input 
              type="text" 
              placeholder="Search projects" 
              className="bg-transparent border-none shadow-none outline-none w-40 text-sm p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          
          {isConnected ? (
            <Button 
              variant="outline" 
              className="hidden md:flex items-center gap-2 rounded-full border-primary text-primary hover:bg-primary hover:text-white transition duration-150"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="h-4 w-4" />
              {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
            </Button>
          ) : (
            <Button 
              className="connect-wallet-btn hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition duration-150 overflow-hidden"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-8">
                {navigation.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "text-lg font-medium text-slate hover:text-primary transition duration-150",
                      location === item.href && "text-primary"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t">
                  {isConnected ? (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 rounded-lg border-primary text-primary hover:bg-primary hover:text-white transition duration-150"
                      onClick={() => setShowWalletModal(true)}
                    >
                      <Wallet className="h-4 w-4" />
                      {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition duration-150"
                      onClick={() => setShowWalletModal(true)}
                    >
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <WalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </header>
  );
}
