import WalletKit from '@reown/walletkit';

// Configure WalletKit with project ID from environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string;

// Create the WalletKit instance
let walletKitInstance: any = null;

// Initialize the WalletKit instance asynchronously
export async function initWalletKit() {
  if (!walletKitInstance) {
    try {
      walletKitInstance = await WalletKit.init({
        projectId,
        metadata: {
          name: 'Frami',
          description: 'A blockchain-powered crowdfunding platform',
          url: window.location.origin,
          icons: ['https://avatars.githubusercontent.com/u/37784886'],
        },
        // Enable Ethereum chain
        chains: ['ethereum'],
      });
      console.log('WalletKit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WalletKit:', error);
    }
  }
  return walletKitInstance;
}

// Get the WalletKit instance
export function getWalletKit() {
  return walletKitInstance;
}

// Helper function to shorten wallet addresses for display
export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

// Helper function to format wallet balances
export function formatBalance(balance?: string, decimals = 4): string {
  if (!balance) return '0';
  const num = parseFloat(balance);
  return num.toFixed(decimals);
}
