import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

// Simple wallet button for now - to avoid the complexity with Web3Modal setup
export default function Web3WalletButton() {
  const [connecting, setConnecting] = useState(false);

  const handleConnectClick = () => {
    setConnecting(true);
    
    // Show connecting state for demo purposes
    setTimeout(() => {
      setConnecting(false);
      // Demo only - would actually connect to wallet here
      window.open('https://metamask.io', '_blank');
    }, 500);
  };

  return (
    <Button 
      onClick={handleConnectClick}
      disabled={connecting}
      className="bg-gradient-to-r from-primary to-[#9376FF] hover:opacity-90 text-white font-medium"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}