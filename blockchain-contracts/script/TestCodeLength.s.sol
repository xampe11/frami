// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

contract TestCodeLength is Script {
    function run() external {
        address testAccount = vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY"));
        address contractAddress = vm.envAddress("FOUNDER_NFT_PROXY_ADDRESS");

        console.log("=== CODE LENGTH TEST ===");
        console.log("Test Account (EOA):", testAccount);
        console.log("Test Account Code Length:", testAccount.code.length);
        console.log("");
        console.log("Contract Address:", contractAddress);
        console.log("Contract Code Length:", contractAddress.code.length);
        console.log("");

        // Test the logic
        if (testAccount.code.length > 0) {
            console.log("EOA would use _safeMint (WRONG!)");
        } else {
            console.log("EOA would use _mint (CORRECT!)");
        }

        if (contractAddress.code.length > 0) {
            console.log("Contract would use _safeMint (CORRECT!)");
        } else {
            console.log("Contract would use _mint (WRONG!)");
        }
    }
}
