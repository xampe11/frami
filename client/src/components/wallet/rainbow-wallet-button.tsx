import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, ExternalLink, Copy, ChevronDown } from "lucide-react";
import { shortenAddress } from '../../lib/rainbowkit-config';

export default function RainbowWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
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
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      <Wallet className="mr-2 h-4 w-4" />
                      {account.displayName}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-xs text-slate-500">Connected to {chain.name}</p>
                      <p className="font-medium">{account.displayName}</p>
                      <p className="text-sm text-slate-600">
                        {account.displayBalance
                          ? `${account.displayBalance}`
                          : ''}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      if (account.address) {
                        navigator.clipboard.writeText(account.address);
                      }
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (account.address) {
                        // Use Etherscan as a fallback if blockExplorers is not available
                        const explorerUrl = chain.blockExplorers?.default?.url || `https://etherscan.io`;
                        window.open(`${explorerUrl}/address/${account.address}`, '_blank');
                      }
                    }}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Explorer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={openAccountModal} className="text-red-500 focus:text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect
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
