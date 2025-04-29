import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown, Copy, LogOut, ExternalLink, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { shortenAddress } from '../lib/utils';

interface WalletData {
  address: string;
  balance: string;
}

export default function CustomConnectWalletButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('wallet_data');
    if (storedWallet) {
      try {
        const data = JSON.parse(storedWallet);
        setWalletData(data);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to parse wallet data', error);
        localStorage.removeItem('wallet_data');
      }
    }
  }, []);

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock wallet data
      const mockAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      const mockBalance = '1.24';
      
      // Save wallet data
      const walletData = {
        address: mockAddress,
        balance: mockBalance
      };
      
      localStorage.setItem('wallet_data', JSON.stringify(walletData));
      setWalletData(walletData);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('wallet_data');
    setWalletData(null);
    setIsConnected(false);
  };

  const copyAddress = () => {
    if (walletData?.address) {
      navigator.clipboard.writeText(walletData.address);
      setIsCopied(true);
    }
  };

  const viewOnExplorer = () => {
    if (walletData?.address) {
      window.open(`https://etherscan.io/address/${walletData.address}`, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Button 
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-gradient-to-r from-primary to-[#9376FF] hover:opacity-90 text-white font-medium transition-all"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 transition-all">
          <Wallet className="mr-2 h-4 w-4" />
          {walletData ? shortenAddress(walletData.address) : '0x...'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs text-slate-500">Connected Wallet</p>
          <p className="font-medium">{walletData ? shortenAddress(walletData.address, 8) : '0x...'}</p>
          <p className="text-sm text-slate-600">
            {walletData?.balance || '0.00'} ETH
          </p>
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
        <DropdownMenuItem onClick={disconnectWallet} className="text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}