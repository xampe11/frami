// Mock wallet store for state management

import { create } from 'zustand';
import { connectWallet, disconnectWallet, checkWalletConnection, saveWalletData, clearWalletData } from '@/lib/wallet';

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  address: null,
  balance: null,
  error: null,
  
  connect: async () => {
    set({ isConnecting: true, error: null });
    
    try {
      const response = await connectWallet();
      
      if (response.connected && response.address) {
        set({ 
          isConnected: true, 
          isConnecting: false,
          address: response.address,
          balance: response.balance || null
        });
        
        // Save wallet info to local storage
        saveWalletData({
          address: response.address,
          balance: response.balance || '0 ETH'
        });
      } else {
        set({ 
          isConnected: false, 
          isConnecting: false,
          error: response.error || 'Failed to connect wallet'
        });
      }
    } catch (error) {
      set({ 
        isConnected: false, 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },
  
  disconnect: async () => {
    set({ isConnecting: true });
    
    try {
      await disconnectWallet();
      set({ 
        isConnected: false, 
        isConnecting: false,
        address: null,
        balance: null,
        error: null
      });
      
      // Clear wallet data from local storage
      clearWalletData();
    } catch (error) {
      set({ 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet'
      });
    }
  },
  
  checkConnection: () => {
    const walletData = checkWalletConnection();
    
    if (walletData.connected && walletData.address) {
      set({
        isConnected: true,
        address: walletData.address,
        balance: walletData.balance || null
      });
    }
  }
}));
