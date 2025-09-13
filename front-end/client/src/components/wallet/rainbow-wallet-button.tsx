import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, ExternalLink, Copy, ChevronDown, User, Globe } from "lucide-react";
import { Link } from "wouter";

// Chain icons mapping
const ChainIcon = ({ chainId }: { chainId: number }) => {
  const getChainIcon = (id: number) => {
    switch (id) {
      case 1: // Ethereum Mainnet
        return (
          <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
            <svg viewBox="0 0 320 512" className="w-3 h-3 fill-white">
              <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" />
            </svg>
          </div>
        );
      case 11155111: // Sepolia
        return (
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 320 512" className="w-3 h-3 fill-white">
              <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z" />
            </svg>
          </div>
        );
      case 137: // Polygon
        return (
          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
              <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm-1.542 4.579l3.063-1.767 3.063 1.767v3.534l-3.063 1.767-3.063-1.767V4.579z" />
            </svg>
          </div>
        );
      case 56: // BSC
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
              <path d="M12 2L13.09 8.26L19 7L14.74 12L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12L5 7L10.91 8.26L12 2Z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
            <Globe className="w-3 h-3 text-white" />
          </div>
        );
    }
  };

  return getChainIcon(chainId);
};

export default function RainbowWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className="flex items-center gap-2"
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="bg-gradient-to-r from-primary to-[#9376FF] hover:opacity-90 text-white font-medium"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Switch Network
                  </Button>
                );
              }

              return (
                <>
                  {/* Network Switcher Button */}
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    size="sm"
                    className="border-[#8A63D2] text-[#8A63D2] hover:bg-[#8A63D2] hover:text-white transition-colors px-3 py-2 h-auto"
                  >
                    <ChainIcon chainId={chain.id} />
                    <span className="ml-2 font-medium">{chain.name}</span>
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>

                  {/* Wallet Account Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-[#8A63D2] text-[#8A63D2] hover:bg-[#8A63D2] hover:text-white transition-colors px-4 py-2 h-auto"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#8A63D2] to-[#9376FF] flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {account.displayName?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">
                              {account.displayName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {account.displayBalance
                                ? `${account.displayBalance}`
                                : ''}
                            </p>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
                    >
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {account.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {account.displayBalance
                            ? `${account.displayBalance}`
                            : ''}
                        </p>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <Link href="/my-profile">
                        <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800">
                          <User className="mr-3 h-4 w-4 text-[#8A63D2]" />
                          <span className="font-medium">My Profile</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(account.address);
                        }}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800"
                      >
                        <Copy className="mr-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span>Copy Address</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          try {
                            let explorerUrl = "https://etherscan.io";

                            // Set correct explorer based on chain
                            switch (chain.id) {
                              case 1: // Mainnet
                                explorerUrl = "https://etherscan.io";
                                break;
                              case 11155111: // Sepolia
                                explorerUrl = "https://sepolia.etherscan.io";
                                break;
                              case 137: // Polygon
                                explorerUrl = "https://polygonscan.com";
                                break;
                              case 56: // BSC
                                explorerUrl = "https://bscscan.com";
                                break;
                              default:
                                explorerUrl = "https://etherscan.io";
                            }

                            window.open(`${explorerUrl}/address/${account.address}`, '_blank');
                          } catch (error) {
                            window.open(`https://etherscan.io/address/${account.address}`, '_blank');
                          }
                        }}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800"
                      >
                        <ExternalLink className="mr-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span>View on Explorer</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem
                        onClick={openAccountModal}
                        className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Disconnect</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}