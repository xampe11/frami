// useWallet.ts - Compatible with Wagmi v2
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { createContext, useContext, ReactNode } from 'react';
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

  // Wrapper function to connect wallet
  const connect = async (type = 'injected'): Promise<void> => {
    try {
      console.log('Connecting wallet...');
      
      if (type === 'metamask' || type === 'injected') {
        await connectAsync({ connector: injected() });
      }
      
      console.log('Wallet connected:', address);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      throw err;
    }
  };

  // Wrapper function to disconnect
  const disconnect = async () => {
    await disconnectAsync();
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