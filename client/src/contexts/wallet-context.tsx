import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateRandomHash } from "@/lib/utils";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: number;
  isConnecting: boolean;
  connect: (provider: string) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  balance: 0,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Check for existing wallet connection in localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem("wallet");
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setIsConnected(true);
        setAddress(walletData.address);
        setBalance(walletData.balance);
      } catch (error) {
        console.error("Failed to parse saved wallet data:", error);
        localStorage.removeItem("wallet");
      }
    }
  }, []);
  
  const connect = async (provider: string): Promise<void> => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random wallet address
      const mockAddress = generateRandomHash();
      const mockBalance = Math.floor(Math.random() * 10) + 1; // 1-10 ETH
      
      // Save wallet data to state and localStorage
      setIsConnected(true);
      setAddress(mockAddress);
      setBalance(mockBalance);
      
      localStorage.setItem("wallet", JSON.stringify({
        address: mockAddress,
        balance: mockBalance,
        provider,
      }));
      
      toast({
        title: "Wallet connected",
        description: `Successfully connected to ${provider}`,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnect = (): void => {
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
    localStorage.removeItem("wallet");
    
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
