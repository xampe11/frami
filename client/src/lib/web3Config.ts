import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { Chain } from 'wagmi/chains';

// 1. Define constants
const projectId = import.meta.env.WALLET_CONNECT_PROJECT_ID as string;

// 2. Create wagmiConfig
const metadata = {
  name: 'Real World Projects',
  description: 'A blockchain-powered crowdfunding platform',
  url: 'https://realworldprojects.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, sepolia] as const;

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata
});

// 3. Create modal
export const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  featuredWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'],
  themeMode: 'light',
  includeWalletIds: []
});

export { wagmiConfig };