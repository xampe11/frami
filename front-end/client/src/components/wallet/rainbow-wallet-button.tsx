import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, ExternalLink, Copy, ChevronDown, User } from "lucide-react";
import { Link } from "wouter";

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
                    Switch Network
                  </Button>
                );
              }

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-[#8A63D2] text-[#8A63D2] hover:bg-[#8A63D2]/10 font-medium">
                      <Wallet className="mr-2 h-4 w-4" />
                      {account.address.substring(0, 6)}...{account.address.substring(account.address.length - 4)}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="flex flex-col space-y-2 p-4 bg-gradient-to-br from-[#8A63D2]/5 to-[#583c8e]/5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Connected to {chain.name}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{account.address.substring(0, 6)}...{account.address.substring(account.address.length - 4)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
                          const explorerUrl = `https://etherscan.io`;
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
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
