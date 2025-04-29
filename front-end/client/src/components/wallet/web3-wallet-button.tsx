import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, ExternalLink, Copy, ChevronDown, Check } from "lucide-react";
import { useState } from 'react';
import { useWallet } from './wallet-provider';

// Helper function to shorten addresses for display
function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export default function Web3WalletButton() {
  const { isConnected, isConnecting, address, balance, connect, disconnect } = useWallet();
  const [isCopied, setIsCopied] = useState(false);

  // Handle copy to clipboard with timeout
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsCopied(true);
    }
  };

  // View on blockchain explorer
  const viewOnExplorer = () => {
    if (address) {
      window.open(`https://etherscan.io/address/${address}`, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Button 
        onClick={connect}
        disabled={isConnecting}
        className="bg-gradient-to-r from-primary to-[#9376FF] hover:opacity-90 text-white font-medium"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <Wallet className="mr-2 h-4 w-4" />
          {shortenAddress(address || '')}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs text-slate-500">Connected Wallet</p>
          <p className="font-medium">{shortenAddress(address || '', 8)}</p>
          {balance && (
            <p className="text-sm text-slate-600">
              {parseFloat(balance || '0').toFixed(4)} ETH
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          {isCopied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewOnExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={disconnect} 
          className="text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}