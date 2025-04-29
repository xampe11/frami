import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

interface MockWalletData {
  address: string;
  balance: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkStoredWallet();
  }, []);

  // Load wallet from localStorage if available
  const checkStoredWallet = () => {
    try {
      const storedWallet = localStorage.getItem('wallet');
      if (storedWallet) {
        const walletData: MockWalletData = JSON.parse(storedWallet);
        setIsConnected(true);
        setAddress(walletData.address);
        setBalance(walletData.balance);
      }
    } catch (err) {
      console.error('Error loading wallet from storage:', err);
      localStorage.removeItem('wallet');
    }
  };

  // Connect wallet
  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Generate mock address
      const mockAddress = generateMockAddress();
      
      // Call our backend wallet connect endpoint
      const response = await apiRequest('POST', '/api/wallet/connect', {
        address: mockAddress
      });
      
      const data = await response.json();
      
      if (data.connected && data.address) {
        setIsConnected(true);
        setAddress(data.address);
        setBalance(data.balance);
        
        // Save to localStorage
        localStorage.setItem('wallet', JSON.stringify({
          address: data.address,
          balance: data.balance
        }));
        
        toast({
          title: "Wallet connected",
          description: `Connected to ${data.address.slice(0, 6)}...${data.address.slice(-4)}`,
        });
      } else {
        setError('Failed to connect wallet');
        toast({
          title: "Connection failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Connection error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    setIsConnecting(true);
    
    try {
      // For this MVP, we just clear the local state
      setIsConnected(false);
      setAddress(null);
      setBalance(null);
      setError(null);
      
      // Remove from localStorage
      localStorage.removeItem('wallet');
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      toast({
        title: "Disconnection error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Generate a mock Ethereum address
  const generateMockAddress = (): string => {
    const chars = '0123456789abcdef';
    let address = '0x';
    
    // Generate 40 hex characters (20 bytes)
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return address;
  };

  const value = {
    isConnected,
    isConnecting,
    address,
    balance,
    error,
    connect,
    disconnect
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
