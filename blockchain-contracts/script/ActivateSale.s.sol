// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";
import {ERC1967Proxy} from "../src/proxy/ERC1967Proxy.sol";

/**
 * @title ActivateSale
 * @dev Activates NFT sale for the FounderNFT contract.
 *
 * Usage:
 * Activates NFT sale for the FounderNFT contract.
 */
contract ActivateSale is Script {
    address FOUNDER_NFT_ADDRESS = vm.envAddress("FOUNDER_NFT_PROXY");

    function run() external {
        // Get deployer account
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        //address deployer = vm.addr(deployerPrivateKey);

        FounderNFT founderNFT = FounderNFT(payable(FOUNDER_NFT_ADDRESS));

        if (founderNFT.getSaleStatus()) {
            console.log("Sale already active");
            return;
        }

        vm.startBroadcast(deployerPrivateKey);
        console.log("   Current status:", founderNFT.getSaleStatus());
        console.log("   Activating NFT sale...");
        founderNFT.setSaleStatus(true);
        console.log("   Sale activated");
        console.log("   Current status:", founderNFT.getSaleStatus());

        vm.stopBroadcast();
    }
}
