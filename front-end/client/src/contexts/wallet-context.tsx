// contexts/wallet-context.tsx - Enhanced with chain support
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { injected } from 'wagmi/connectors';
import { mainnet, sepolia, polygon, bsc } from 'wagmi/chains';

// Supported chains array
const supportedChains = [mainnet, sepolia, polygon, bsc];

// Helper function to get chain by ID
const getChainById = (chainId: number) => {
  return supportedChains.find(chain => chain.id === chainId);
};

// Helper function to get explorer URL
const getExplorerUrl = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain?.blockExplorers?.default?.url || 'https://etherscan.io';
};

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: (type?: string) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  isSwitchingChain: boolean;
  currentChain: {
    id: number;
    name: string;
    explorerUrl: string;
  } | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // Use Wagmi v2 hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, isPending: isConnecting, error } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  // Get current chain from Wagmi's supported chains
  const currentChain = chainId ? getChainById(chainId) : null;

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

  // Switch chain function
  const switchChain = async (targetChainId: number): Promise<void> => {
    try {
      console.log('Switching to chain:', targetChainId);
      await switchChainAsync({ chainId: targetChainId });

      // Update localStorage with new chain
      const walletData = localStorage.getItem('wallet');
      if (walletData) {
        const parsed = JSON.parse(walletData);
        localStorage.setItem('wallet', JSON.stringify({
          ...parsed,
          chainId: targetChainId,
          timestamp: new Date().getTime()
        }));
      }
    } catch (err) {
      console.error('Failed to switch chain:', err);
      throw err;
    }
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
        switchChain,
        isSwitchingChain,
        currentChain: currentChain ? {
          id: currentChain.id,
          name: currentChain.name,
          explorerUrl: getExplorerUrl(currentChain.id),
        } : null,
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