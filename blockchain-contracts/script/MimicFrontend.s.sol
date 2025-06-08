// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

contract MimicFrontend is Script {
    address FOUNDER_NFT_PROXY = vm.envAddress("FOUNDER_NFT_PROXY_ADDRESS");

    function run() external {
        console.log("=== MIMICKING FRONTEND CALL ===");
        
        FounderNFT founderNFT = FounderNFT(payable(FOUNDER_NFT_PROXY));
        
        // Use the EXACT same address as your frontend
        address frontendAccount = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        uint256 quantity = 1;
        uint256 price = founderNFT.getPrice();
        uint256 totalCost = price * quantity;
        
        console.log("Frontend Account:", frontendAccount);
        console.log("Account Code Length:", frontendAccount.code.length);
        console.log("Quantity:", quantity);
        console.log("Price:", price);
        console.log("Total Cost:", totalCost);
        console.log("Account Balance:", frontendAccount.balance);
        
        // Test 1: Try direct call (gas estimation in forge is automatic)
        console.log("\n--- TEST 1: DIRECT CALL TEST ---");
        
        // Test 2: Try the actual call with vm.prank
        console.log("\n--- TEST 2: ACTUAL CALL ---");
        vm.startPrank(frontendAccount);
        
        (bool success, bytes memory returnData) = address(founderNFT).call{value: totalCost}(
            abi.encodeWithSignature("mintMultiple(uint256)", quantity)
        );
        
        if (success) {
            console.log(" Call succeeded!");
            console.log("New supply:", founderNFT.totalSupply());
        } else {
            console.log(" Call failed");
            if (returnData.length >= 4) {
                bytes4 selector = bytes4(returnData);
                console.log("Error selector:", vm.toString(selector));
                console.log("Full error data:", vm.toString(returnData));
                
                // Check if it's the same error as frontend
                if (selector == 0x64a0ae92) {
                    console.log(" SAME ERROR AS FRONTEND!");
                }
            }
        }
        vm.stopPrank();
        
        // Test 3: Try with different gas limits
        console.log("\n--- TEST 3: DIFFERENT GAS LIMITS ---");
        uint256[] memory gasLimits = new uint256[](4);
        gasLimits[0] = 100000;
        gasLimits[1] = 300000;
        gasLimits[2] = 500000;
        gasLimits[3] = 1000000;
        
        for (uint256 i = 0; i < gasLimits.length; i++) {
            console.log("Testing gas limit:", gasLimits[i]);
            vm.startPrank(frontendAccount);
            
            (bool success,) = address(founderNFT).call{value: totalCost, gas: gasLimits[i]}(
                abi.encodeWithSignature("mintMultiple(uint256)", quantity)
            );
            
            if (success) {
                console.log(" Succeeded with gas limit:", gasLimits[i]);
                break;
            } else {
                console.log(" Failed with gas limit:", gasLimits[i]);
            }
            vm.stopPrank();
        }
    }
}