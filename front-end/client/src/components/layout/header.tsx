import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWalletStore } from "@/store/wallet-store";
import { Menu, Search, X } from "lucide-react";
import gsap from "gsap";

const Header = () => {
  const [location] = useLocation();
  const { isConnected, connect, disconnect, address } = useWalletStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isScrolled) {
      gsap.to("header", {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(8px)",
        duration: 0.3,
      });
    } else {
      gsap.to("header", {
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(0px)",
        duration: 0.3,
      });
    }
  }, [isScrolled]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would implement search functionality
    console.log("Search for:", searchValue);
  };

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  const navLinks = [
    { title: "Discover", path: "/explore" },
    { title: "Start a Project", path: "/create-project" },
    { title: "How It Works", path: "/#how-it-works" },
    { title: "About", path: "/#about" },
  ];

  return (
    <header className="bg-white sticky top-0 z-50 transition-all duration-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <span className="text-2xl font-bold font-heading text-gradient tracking-wide">
                Frami
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex ml-12 space-x-8">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <span
                  className={`nav-link ${location === link.path ? "text-primary" : ""}`}
                >
                  {link.title}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <form onSubmit={handleSearch}>
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                type="text"
                placeholder="Search projects..."
                className="px-4 py-2 pr-10 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm w-48 md:w-64"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>
          </div>

          <button onClick={handleWalletClick} className="wallet-button">
            {isConnected ? (
              <>
                <i className="fas fa-check-circle mr-2"></i>
                <span>
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </>
            ) : (
              <>
                <i className="fas fa-wallet mr-2"></i>
                <span>Connect Wallet</span>
              </>
            )}
          </button>

          <Link href={isConnected ? "/profile" : "/login"}>
            <Button className="hidden md:inline-flex btn-primary">
              {isConnected ? "My Account" : "Sign Up"}
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full">
                <div className="py-6 border-b">
                  <form className="relative" onSubmit={handleSearch}>
                    <Input
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search projects..."
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </form>
                </div>

                <nav className="flex flex-col py-6">
                  {navLinks.map((link) => (
                    <Link key={link.path} href={link.path}>
                      <span
                        className={`py-3 px-2 font-medium block cursor-pointer ${
                          location === link.path
                            ? "text-primary"
                            : "text-gray-800"
                        }`}
                      >
                        {link.title}
                      </span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto pb-6 space-y-4">
                  <button
                    onClick={handleWalletClick}
                    className="wallet-button w-full justify-center"
                  >
                    {isConnected ? (
                      <>
                        <i className="fas fa-check-circle mr-2"></i>
                        <span>
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-wallet mr-2"></i>
                        <span>Connect Wallet</span>
                      </>
                    )}
                  </button>

                  <Link href={isConnected ? "/profile" : "/login"}>
                    <Button className="w-full btn-primary">
                      {isConnected ? "My Account" : "Sign Up"}
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
