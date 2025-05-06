// Simplified wallet-context.tsx - Compatible with Wagmi v2
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { injected } from 'wagmi/connectors';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: (type?: string) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // Use Wagmi v2 hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, isPending: isConnecting, error } = useConnect();
  const { disconnectAsync } = useDisconnect();
  
  // Check localStorage for wallet data on mount
  useEffect(() => {
    try {
      const walletData = localStorage.getItem('wallet');
      if (walletData && !isConnected) {
        console.log('Found wallet in localStorage, but not connected in Wagmi state');
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, [isConnected]);

  // Connect wallet function
  const connect = async (type = 'injected'): Promise<void> => {
    try {
      console.log('Connecting wallet...');
      
      if (type === 'metamask' || type === 'injected') {
        const result = await connectAsync({ connector: injected() });
        console.log('Wallet connected:', result.accounts[0]);
        
        // Save to localStorage for persistence
        localStorage.setItem('wallet', JSON.stringify({
          address: result.accounts[0], 
          chainId: result.chainId,
          connected: true,
          timestamp: new Date().getTime()
        }));
        
        // For create-project page, we optionally refresh to ensure correct state
        if (window.location.pathname.includes('/create-project')) {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      throw err;
    }
  };

  // Disconnect wallet function
  const disconnect = async () => {
    await disconnectAsync();
    localStorage.removeItem('wallet');
    console.log('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        address: address || null,
        chainId: chainId || null,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook for using the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}