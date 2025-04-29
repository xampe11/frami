import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { initWalletKit, getWalletKit } from '../../lib/walletKit';

// Define the type for our wallet context
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  balance: null,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
});

// Provider component that wraps our app and makes wallet context available
export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize WalletKit
  useEffect(() => {
    const initialize = async () => {
      try {
        await initWalletKit();
        const walletKit = getWalletKit();
        
        if (walletKit) {
          // Check if already connected
          const connected = await walletKit.isConnected?.();
          
          if (connected) {
            // Get wallet address
            const address = await walletKit.getAddress?.();
            setAddress(address);
            
            // Get wallet balance
            const balance = await walletKit.getBalance?.();
            setBalance(balance?.formatted || '0');
            
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
      }
    };
    
    initialize();
  }, []);

  // Connect wallet function
  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletKit = getWalletKit();
      if (!walletKit) {
        await initWalletKit();
      }
      
      const kit = getWalletKit();
      if (kit) {
        await kit.connect?.();
        
        // Get the connected address
        const address = await kit.getAddress?.();
        setAddress(address);
        
        // Get balance if available
        try {
          const balanceResult = await kit.getBalance?.();
          if (balanceResult) {
            setBalance(balanceResult.formatted);
          }
        } catch (e) {
          console.warn('Could not fetch balance:', e);
        }
        
        setIsConnected(true);
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = async () => {
    try {
      const walletKit = getWalletKit();
      if (walletKit) {
        await walletKit.disconnect?.();
        setAddress(null);
        setBalance(null);
        setIsConnected(false);
      }
    } catch (err: any) {
      console.error('Failed to disconnect wallet:', err);
      setError(err?.message || 'Failed to disconnect wallet');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        balance,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);
