// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

/**
 * @title MintAndStake
 * @dev Foundry script that mints 5 nfts, then stake them and mint another 10 nfts.
 *
 * Usage:
 * forge script script/MintAndStake.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 *
 * Environment Variables Required:
 * - DEPLOYER_PRIVATE_KEY: Private key for deployment
 * - FOUNDER_NFT_PROXY_ADDRESS: Current FounderNFT proxy address
 */
contract MintAndStake is Script {
    uint256 NFTS_TO_MINT = 5;
    address FOUNDER_NFT_ADDRESS = vm.envAddress("FOUNDER_NFT_PROXY_ADDRESS");

    function run() external {
        // Get deployer account
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        FounderNFT founderNFT = FounderNFT(payable(FOUNDER_NFT_ADDRESS));

        vm.startBroadcast(deployerPrivateKey);
        console.log("   Minting ", NFTS_TO_MINT, " NFTs...");
        founderNFT.mintMultiple(NFTS_TO_MINT);
        console.log("   Done");
        console.log("   Staking ", " NFTs...");
        //founderNFT.stakeMultipleTokens();
        console.log("   Current status:", founderNFT.getSaleStatus());

        vm.stopBroadcast();
    }
}
