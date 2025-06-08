// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

contract TestSingleMint is Script {
    address FOUNDER_NFT_PROXY = vm.envAddress("FOUNDER_NFT_PROXY_ADDRESS");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address testAccount = vm.addr(deployerPrivateKey);

        console.log("=== TESTING SINGLE MINT ===");
        console.log("Proxy Address:", FOUNDER_NFT_PROXY);
        console.log("Test Account:", testAccount);

        FounderNFT founderNFT = FounderNFT(payable(FOUNDER_NFT_PROXY));
        uint256 price = founderNFT.getPrice();

        console.log("Price:", price, "wei");
        console.log("Account Balance Before:", testAccount.balance);

        vm.startBroadcast(deployerPrivateKey);

        try founderNFT.mint{value: price}() {
            console.log(" SUCCESS: Regular mint() worked!");
        } catch Error(string memory reason) {
            console.log(" FAILED: Regular mint() reverted with:", reason);
        } catch (bytes memory lowLevelData) {
            console.log(" FAILED: Regular mint() reverted with low-level error");
            console.log("Error data length:", lowLevelData.length);
        }

        vm.stopBroadcast();

        console.log("Account Balance After:", testAccount.balance);
        console.log("New Supply:", founderNFT.totalSupply());
    }
}
