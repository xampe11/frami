// Mock wallet connection functionality

interface WalletResponse {
  connected: boolean;
  address?: string;
  balance?: string;
  error?: string;
}

// Simulate wallet connection
export const connectWallet = async (): Promise<WalletResponse> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a mock ETH address
    const address = generateMockAddress();
    
    // Make a real API call to our backend endpoint
    const response = await fetch('/api/wallet/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to connect wallet');
    }
    
    const data = await response.json();
    return {
      connected: true,
      address: data.address,
      balance: data.balance,
    };
  } catch (error) {
    console.error('Wallet connection error:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Simulate wallet disconnection
export const disconnectWallet = async (): Promise<WalletResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    connected: false,
  };
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

// Check if wallet is connected based on local storage
export const checkWalletConnection = (): WalletResponse => {
  if (typeof window === 'undefined') {
    return { connected: false };
  }
  
  const storedWallet = localStorage.getItem('wallet');
  
  if (!storedWallet) {
    return { connected: false };
  }
  
  try {
    const wallet = JSON.parse(storedWallet);
    return {
      connected: true,
      address: wallet.address,
      balance: wallet.balance,
    };
  } catch (error) {
    localStorage.removeItem('wallet');
    return { connected: false };
  }
};

// Save wallet data to local storage
export const saveWalletData = (data: { address: string; balance: string }) => {
  localStorage.setItem('wallet', JSON.stringify(data));
};

// Clear wallet data from local storage
export const clearWalletData = () => {
  localStorage.removeItem('wallet');
};
