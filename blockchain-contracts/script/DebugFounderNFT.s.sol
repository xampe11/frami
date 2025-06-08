// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

contract DebugFounderNFT is Script {
    address FOUNDER_NFT_PROXY = vm.envAddress("FOUNDER_NFT_PROXY_ADDRESS");

    function run() external {
        console.log("=== DEBUGGING FOUNDER NFT CONTRACT ===");
        console.log("Proxy Address:", FOUNDER_NFT_PROXY);
        console.log("Test Account:", vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY")));
        console.log("");

        FounderNFT founderNFT = FounderNFT(payable(FOUNDER_NFT_PROXY));

        // === 1. CHECK BASIC CONTRACT STATE ===
        console.log("--- 1. BASIC CONTRACT STATE ---");
        try founderNFT.getSaleStatus() returns (bool saleActive) {
            console.log("Sale Active:", saleActive);
            if (!saleActive) {
                console.log(" ISSUE: Sale is not active!");
            }
        } catch {
            console.log(" ERROR: Cannot check sale status");
            return;
        }

        try founderNFT.totalSupply() returns (uint256 currentSupply) {
            console.log("Current Supply:", currentSupply);
        } catch {
            console.log(" ERROR: Cannot check total supply");
            return;
        }

        try founderNFT.getMaxSupply() returns (uint256 maxSupply) {
            console.log("Max Supply:", maxSupply);
        } catch {
            console.log(" ERROR: Cannot check max supply");
            return;
        }

        try founderNFT.getPrice() returns (uint256 price) {
            console.log("NFT Price:", price, "wei");
            console.log("NFT Price:", price / 1e18, "ETH (approximately)");
        } catch {
            console.log(" ERROR: Cannot check price");
            return;
        }

        console.log("");

        // === 2. CHECK SUPPLY LIMITS ===
        console.log("--- 2. SUPPLY LIMIT CHECKS ---");
        uint256 currentSupply = founderNFT.totalSupply();
        uint256 maxSupply = founderNFT.getMaxSupply();

        console.log("Current + 1:", currentSupply + 1);
        console.log("Current + 5:", currentSupply + 5);
        console.log("Current + 10:", currentSupply + 10);

        if (currentSupply + 1 > maxSupply) {
            console.log(" ISSUE: Cannot mint even 1 NFT - supply exceeded!");
        } else if (currentSupply + 5 > maxSupply) {
            console.log("  WARNING: Can only mint", maxSupply - currentSupply, "more NFTs");
        } else {
            console.log(" Supply check: Can mint up to 10 NFTs");
        }
        console.log("");

        // === 3. PAYMENT CALCULATIONS ===
        console.log("--- 3. PAYMENT CALCULATIONS ---");
        uint256 price = founderNFT.getPrice();
        address testAccount = vm.addr(vm.envUint("DEPLOYER_PRIVATE_KEY"));
        uint256 accountBalance = testAccount.balance;

        console.log("Account Balance:", accountBalance, "wei");
        console.log("Account Balance:", accountBalance / 1e18, "ETH (approximately)");
        console.log("");

        for (uint256 qty = 1; qty <= 3; qty++) {
            uint256 totalCost = price * qty;
            console.log("Quantity", qty, ":");
            console.log("  Total Cost:", totalCost, "wei");
            console.log("  Total Cost:", totalCost / 1e18, "ETH (approximately)");
            console.log("  Can Afford:", accountBalance >= totalCost ? "YES" : "NO");

            if (accountBalance < totalCost) {
                console.log("   ISSUE: Insufficient balance for quantity", qty);
            }
        }
        console.log("");

        // === 4. FUNCTION EXISTENCE CHECK ===
        console.log("--- 4. FUNCTION EXISTENCE CHECK ---");

        // Check if mintMultiple exists by calling it with invalid params to see the error
        vm.startPrank(testAccount);
        try founderNFT.mintMultiple{value: 0}(0) {
            console.log(" UNEXPECTED: mintMultiple with invalid params succeeded");
        } catch (bytes memory reason) {
            bytes4 selector = bytes4(reason);
            console.log("mintMultiple error selector:", vm.toString(selector));

            // Check if it's a specific known error
            if (selector == bytes4(keccak256("Error(string)"))) {
                console.log(" mintMultiple function exists (got string error)");
            } else if (reason.length >= 4) {
                console.log(" mintMultiple function exists (got custom error)");
            } else {
                console.log(" mintMultiple function might not exist");
            }
        }
        vm.stopPrank();
        console.log("");

        // === 5. TRY ACTUAL MINT WITH PROPER VALUES ===
        console.log("--- 5. ATTEMPTING REAL MINT TEST ---");

        bool saleActive = founderNFT.getSaleStatus();
        if (!saleActive) {
            console.log("  SKIPPING: Sale is not active");
            console.log("Run ActivateSale.s.sol first!");
            return;
        }

        uint256 testPrice = price * 5; // Try minting 5 NFTs

        console.log("Attempting to mint 1 NFT with price:", testPrice, "wei");

        vm.startPrank(testAccount);
        try founderNFT.mintMultiple{value: testPrice}(5) {
            console.log(" SUCCESS: mintMultiple(5) worked!");
        } catch (bytes memory reason) {
            console.log(" FAILED: mintMultiple(5) reverted");
            console.log("Error data length:", reason.length);

            if (reason.length >= 4) {
                bytes4 errorSelector = bytes4(reason);
                console.log("Error selector:", vm.toString(errorSelector));

                // Try to decode common errors
                if (errorSelector == bytes4(keccak256("Error(string)"))) {
                    // Create new bytes array without the selector
                    bytes memory errorData = new bytes(reason.length - 4);
                    for (uint256 i = 4; i < reason.length; i++) {
                        errorData[i - 4] = reason[i];
                    }
                    string memory errorMsg = abi.decode(errorData, (string));
                    console.log("Error message:", errorMsg);
                } else {
                    console.log("Custom error with selector:", vm.toString(errorSelector));
                    console.log("Raw error data:", vm.toString(reason));
                }
            }
        }
        vm.stopPrank();

        console.log("");
        console.log("=== DEBUG COMPLETE ===");
    }
}
