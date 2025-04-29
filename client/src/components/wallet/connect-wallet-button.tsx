import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { web3Modal } from '../../lib/web3Config';

export default function ConnectWalletButton() {
  const handleClick = () => {
    web3Modal.open();
  };

  return (
    <Button 
      onClick={handleClick} 
      className="bg-gradient-to-r from-primary to-[#9376FF] hover:opacity-90 text-white font-medium"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}