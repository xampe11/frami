// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FounderNFT} from "../src/FounderNFT.sol";

/**
 * @title CheckRewards
 * @dev Foundry script that checks and logs all available rewards data from the FounderNFT contract
 *
 * Usage:
 * forge script script/CheckRewards.s.sol --rpc-url <RPC_URL>
 *
 * Environment Variables Required:
 * - FOUNDER_NFT_PROXY: Current FounderNFT proxy address
 */
contract CheckRewards is Script {
    address FOUNDER_NFT_ADDRESS = vm.envAddress("FOUNDER_NFT_PROXY");

    function run() external view {
        FounderNFT founderNFT = FounderNFT(payable(FOUNDER_NFT_ADDRESS));

        console.log("========================================");
        console.log("FOUNDER NFT REWARDS DATA");
        console.log("========================================");
        console.log("");

        // ============ GLOBAL REWARDS STATE ============
        console.log("--- GLOBAL REWARDS STATE ---");
        console.log("Contract Address:", FOUNDER_NFT_ADDRESS);
        console.log("Contract Balance (wei):", address(founderNFT).balance);
        console.log("Contract Balance (ETH):", address(founderNFT).balance / 1e18);
        console.log("");

        console.log("Total Staked Supply:", founderNFT.getTotalStakedSupply());
        console.log("Total NFT Supply:", founderNFT.totalSupply());
        console.log("Max Supply:", founderNFT.getMaxSupply());
        console.log("");

        console.log("Current Reward Rate (wei/sec):", founderNFT.getCurrentRewardRate());
        console.log("Reward Per Token Stored:", founderNFT.getRewardPerTokenStored());
        console.log("Last Update Time:", founderNFT.getLastUpdateTime());
        console.log("Current Reward Per Token:", founderNFT.rewardPerToken());
        console.log("");

        // ============ REWARD CONFIGURATION ============
        console.log("--- REWARD CONFIGURATION ---");
        console.log("Minimum Staking Period (seconds):", founderNFT.getMinimumStakingPeriod());
        console.log("Minimum Staking Period (days):", founderNFT.getMinimumStakingPeriod() / 86400);

        (
            uint256 minimumStakingPeriod,
            uint256 baseAPR,
            uint256 performanceMultiplier,
            uint256 rewardCalculationPeriod,
            uint256 maxStakeAmount,
            bool emergencyWithdrawEnabled
        ) = founderNFT.getPlatformConfiguration();

        console.log("Base APR (basis points):", baseAPR);
        console.log("Base APR (%):", baseAPR / 100);
        console.log("Performance Multiplier:", performanceMultiplier);
        console.log("Reward Calculation Period (sec):", rewardCalculationPeriod);
        console.log("Max Stake Amount:", maxStakeAmount);
        console.log("Emergency Withdraw Enabled:", emergencyWithdrawEnabled);
        console.log("Estimated APR (basis points):", founderNFT.getEstimatedAPR());
        console.log("Estimated APR (%):", founderNFT.getEstimatedAPR() / 100);
        console.log("");

        // ============ SALES & DISTRIBUTION ============
        console.log("--- SALES & DISTRIBUTION ---");
        console.log("Sale Active:", founderNFT.getSaleStatus());
        console.log("NFT Price (wei):", founderNFT.getPrice());
        console.log("NFT Price (ETH):", founderNFT.getPrice() / 1e18);
        console.log("Total Sales Proceeds (wei):", founderNFT.getTotalSalesProceeds());
        console.log("Total Sales Proceeds (ETH):", founderNFT.getTotalSalesProceeds() / 1e18);
        console.log("Sales Redistribution %:", founderNFT.getSalesRedistributionPercentage() / 100);
        console.log("Platform Fee Distribution %:", founderNFT.getPlatformFeeDistributionPercentage() / 100);
        console.log("DAO Token Allocation %:", founderNFT.getDaoTokenAllocationPercentage() / 100);
        console.log("");

        // ============ PER-TOKEN REWARDS DATA ============
        console.log("--- PER-TOKEN STAKING & REWARDS ---");
        uint256 totalSupply = founderNFT.totalSupply();

        if (totalSupply > 0) {
            for (uint256 i = 0; i < totalSupply; i++) {
                uint256 tokenId = founderNFT.tokenByIndex(i);
                bool isStaked = founderNFT.isTokenStaked(tokenId);

                console.log("Token ID:", tokenId);
                console.log("  Is Staked:", isStaked);

                if (isStaked) {
                    (address owner, uint256 stakedSince, uint256 lastRewardsClaimed) = founderNFT.getStakingInfo(tokenId);
                    uint256 earned = founderNFT.earned(tokenId);
                    uint256 timeStaked = block.timestamp - stakedSince;

                    console.log("  Owner:", owner);
                    console.log("  Staked Since:", stakedSince);
                    console.log("  Time Staked (seconds):", timeStaked);
                    console.log("  Time Staked (days):", timeStaked / 86400);
                    console.log("  Last Rewards Claimed:", lastRewardsClaimed);
                    console.log("  Earned Rewards (wei):", earned);
                    console.log("  Earned Rewards (ETH):", earned / 1e18);
                    console.log("  Stored Rewards (wei):", founderNFT.getRewards(tokenId));
                    console.log("  User Reward Per Token Paid:", founderNFT.getUserRewardPerTokenPaid(tokenId));

                    uint256 minStakingPeriod = founderNFT.getMinimumStakingPeriod();
                    bool canUnstake = timeStaked >= minStakingPeriod;
                    console.log("  Can Unstake:", canUnstake);
                    if (!canUnstake) {
                        console.log("  Time Until Unstake (seconds):", minStakingPeriod - timeStaked);
                    }
                } else {
                    console.log("  Owner:", founderNFT.ownerOf(tokenId));
                }
                console.log("");
            }
        } else {
            console.log("No tokens have been minted yet.");
        }

        // ============ OWNER-BASED REWARDS SUMMARY ============
        console.log("--- OWNER-BASED REWARDS SUMMARY ---");

        // Get unique owners by iterating through all tokens
        address[] memory uniqueOwners = new address[](totalSupply);
        uint256 ownerCount = 0;

        for (uint256 i = 0; i < totalSupply; i++) {
            uint256 tokenId = founderNFT.tokenByIndex(i);
            address tokenOwner;

            if (founderNFT.isTokenStaked(tokenId)) {
                (address stakedOwner,,) = founderNFT.getStakingInfo(tokenId);
                tokenOwner = stakedOwner;
            } else {
                tokenOwner = founderNFT.ownerOf(tokenId);
            }

            // Check if owner is already in the list
            bool isNewOwner = true;
            for (uint256 j = 0; j < ownerCount; j++) {
                if (uniqueOwners[j] == tokenOwner) {
                    isNewOwner = false;
                    break;
                }
            }

            if (isNewOwner) {
                uniqueOwners[ownerCount] = tokenOwner;
                ownerCount++;
            }
        }

        // Display summary for each unique owner
        for (uint256 i = 0; i < ownerCount; i++) {
            address owner = uniqueOwners[i];
            console.log("Owner:", owner);
            console.log("  Total NFTs Owned:", founderNFT.balanceOf(owner));
            console.log("  Staked NFT Count:", founderNFT.getStakedCountByOwner(owner));
            console.log("  Has Staked Tokens:", founderNFT.hasStakedTokens(owner));
            console.log("  Is Founder:", founderNFT.isFounder(owner));

            if (founderNFT.hasStakedTokens(owner)) {
                uint256[] memory stakedTokens = founderNFT.getStakedByOwner(owner);
                console.log("  Total Earned (wei):", founderNFT.getTotalEarnedByOwner(owner));
                console.log("  Total Earned (ETH):", founderNFT.getTotalEarnedByOwner(owner) / 1e18);

                console.log("  Staked Token IDs:");
                for (uint256 j = 0; j < stakedTokens.length; j++) {
                    console.log("    -", stakedTokens[j]);
                }
            }
            console.log("");
        }

        console.log("========================================");
        console.log("END OF REWARDS DATA");
        console.log("========================================");
    }
}
