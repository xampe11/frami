import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/wallet-context";
import { X } from "lucide-react";
import { FaBitcoin, FaWallet, FaLink } from "react-icons/fa";

interface WalletOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connect, isConnecting } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletOptions: WalletOption[] = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: <FaBitcoin size={18} />,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-500"
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: <FaWallet size={18} />,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-500"
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: <FaLink size={18} />,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-500"
    }
  ];

  const handleConnectWallet = (walletId: string) => {
    setSelectedWallet(walletId);
    connect(walletId);
    setTimeout(() => {
      onOpenChange(false);
      setSelectedWallet(null);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-inter">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              onClick={() => handleConnectWallet(wallet.id)}
              disabled={isConnecting}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full ${wallet.bgColor} flex items-center justify-center mr-3`}>
                  <span className={wallet.iconColor}>{wallet.icon}</span>
                </div>
                <span className="font-medium">{wallet.name}</span>
              </div>
              {selectedWallet === wallet.id && isConnecting ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-2 text-center text-sm text-gray-500">
          <p>
            By connecting your wallet, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
