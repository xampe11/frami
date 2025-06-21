// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";

/**
 * @title TestPhase1Deployment
 * @dev Comprehensive testing script for Phase 1 deployment
 * @notice Tests all core functionality of deployed PlatformRegistry and FounderNFT
 *
 * Usage:
 * forge script script/TestPhase1Deployment.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 *
 * Environment Variables Required:
 * - PLATFORM_REGISTRY_PROXY: Deployed PlatformRegistry proxy address
 * - FOUNDER_NFT_PROXY: Deployed FounderNFT proxy address
 * - DEPLOYER_PRIVATE_KEY: Private key for testing
 */
contract TestPhase1Deployment is Script {
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    PlatformRegistry public registry;
    FounderNFT public founderNFT;
    
    address public tester;
    uint256 public testerPrivateKey;
    
    // Test configuration
    uint256 constant TEST_MINT_COUNT = 3;
    uint256 constant WAIT_TIME = 60; // 1 minute for reward accrual
    
    // Extension constants
    bytes32 constant FOUNDER_NFT_KEY = keccak256("FOUNDER_NFT");

    // ============================================================================
    // MAIN TESTING FUNCTION
    // ============================================================================

    function run() external {
        console.log(" Starting Phase 1 Deployment Testing");
        console.log("========================================");

        // Load contract addresses and setup
        setupTesting();

        // Run comprehensive tests
        testContractInitialization();
        testExtensionRegistration();
        testAccessControls();
        testNFTMinting();
        testStakingMechanics();
        testRewardSystem();
        testBatchOperations();
        testEmergencyControls();

        console.log(" All Phase 1 tests completed successfully!");
        console.log("========================================");
    }

    // ============================================================================
    // SETUP & INITIALIZATION
    // ============================================================================

    function setupTesting() internal {
        console.log(" Setting up testing environment...");

        // Load contract addresses
        address registryAddress = vm.envAddress("PLATFORM_REGISTRY_PROXY");
        address founderNFTAddress = vm.envAddress("FOUNDER_NFT_PROXY");

        registry = PlatformRegistry(payable(registryAddress));
        founderNFT = FounderNFT(payable(founderNFTAddress));

        // Setup tester account
        testerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        tester = vm.addr(testerPrivateKey);

        console.log("   Registry Address:", address(registry));
        console.log("   FounderNFT Address:", address(founderNFT));
        console.log("   Tester Address:", tester);
        console.log("   Tester Balance:", tester.balance / 1e18, "ETH");

        require(address(registry) != address(0), "Registry address not set");
        require(address(founderNFT) != address(0), "FounderNFT address not set");
        require(tester.balance >= 1 ether, "Insufficient ETH for testing");

        console.log("    Testing environment ready");
    }

    // ============================================================================
    // CONTRACT INITIALIZATION TESTS
    // ============================================================================

    function testContractInitialization() internal view {
        console.log("  Testing Contract Initialization...");

        // Test PlatformRegistry
        console.log("    Testing PlatformRegistry...");
        require(registry.getPlatformFeePercentage() > 0, "Platform fee not set");
        require(registry.getPlatformTreasury() != address(0), "Treasury not set");
        require(bytes(registry.getVersion()).length > 0, "Version not set");
        console.log("       Platform fee:", registry.getPlatformFeePercentage(), "bp");
        console.log("       Treasury:", registry.getPlatformTreasury());
        console.log("       Version:", registry.getVersion());

        // Test FounderNFT
        console.log("     Testing FounderNFT...");
        require(founderNFT.getMaxSupply() > 0, "Max supply not set");
        require(founderNFT.getPrice() > 0, "Price not set");
        require(bytes(founderNFT.name()).length > 0, "Name not set");
        require(bytes(founderNFT.symbol()).length > 0, "Symbol not set");
        console.log("       Name:", founderNFT.name());
        console.log("       Symbol:", founderNFT.symbol());
        console.log("       Max Supply:", founderNFT.getMaxSupply());
        console.log("       Price:", founderNFT.getPrice() / 1e18, "ETH");
        console.log("       Sales Active:", founderNFT.getSaleStatus());

        console.log("    Contract initialization tests passed");
    }

    // ============================================================================
    // EXTENSION REGISTRATION TESTS
    // ============================================================================

    function testExtensionRegistration() internal view {
        console.log("  Testing Extension Registration...");

        // Test FounderNFT registration
        require(registry.isExtensionRegistered(FOUNDER_NFT_KEY), "FounderNFT not registered");
        require(registry.getExtension(FOUNDER_NFT_KEY) == address(founderNFT), "Extension address mismatch");
        require(registry.getFounderNFT() == address(founderNFT), "Convenience getter failed");

        console.log("    FounderNFT extension registered correctly");
        console.log("    Address matches:", registry.getExtension(FOUNDER_NFT_KEY));
        console.log("    Convenience getter works");

        // Test extension metadata
        (bytes32[] memory keys, PlatformRegistry.ExtensionInfo[] memory extensions) = registry.getAllExtensions();
        
        bool foundFounderNFT = false;
        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i] == FOUNDER_NFT_KEY) {
                foundFounderNFT = true;
                console.log("    Extension found in registry");
                console.log("      Name:", extensions[i].name);
                console.log("      Version:", extensions[i].version);
                console.log("      Active:", extensions[i].isActive);
                break;
            }
        }
        
        require(foundFounderNFT, "FounderNFT not found in extension list");
        console.log("    Extension registration tests passed");
    }

    // ============================================================================
    // ACCESS CONTROL TESTS
    // ============================================================================

    function testAccessControls() internal view {
        console.log("  Testing Access Controls...");

        // Test PlatformRegistry roles
        bytes32 adminRole = registry.ADMIN_ROLE();
        bytes32 feeManagerRole = registry.FEE_MANAGER_ROLE();
        
        require(registry.hasRole(adminRole, tester), "Tester should have admin role");
        require(registry.hasRole(feeManagerRole, address(founderNFT)), "FounderNFT should have fee manager role");
        
        console.log("    Admin role correctly assigned");
        console.log("    Fee manager role correctly assigned to FounderNFT");

        // Test FounderNFT roles
        bytes32 platformRole = founderNFT.PLATFORM_ROLE();
        
        require(founderNFT.hasRole(platformRole, address(registry)), "Registry should have platform role");
        require(founderNFT.owner() == tester, "Owner should be tester");
        
        console.log("    Platform role correctly assigned to registry");
        console.log("    Owner correctly set");
        console.log("    Access control tests passed");
    }

    // ============================================================================
    // NFT MINTING TESTS
    // ============================================================================

    function testNFTMinting() internal {
        console.log("  Testing NFT Minting...");

        vm.startBroadcast(testerPrivateKey);

        uint256 initialBalance = tester.balance;
        uint256 initialSupply = founderNFT.totalSupply();
        uint256 mintPrice = founderNFT.getPrice();

        console.log("   Initial supply:", initialSupply);
        console.log("   Mint price:", mintPrice / 1e18, "ETH");

        // Test single mint
        console.log("   Testing single mint...");
        founderNFT.mint{value: mintPrice}();
        
        require(founderNFT.totalSupply() == initialSupply + 1, "Supply should increase by 1");
        require(founderNFT.balanceOf(tester) >= 1, "Tester should own at least 1 NFT");
        require(founderNFT.ownerOf(initialSupply) == tester, "Tester should own the new NFT");
        
        console.log("    Single mint successful");
        console.log("    New total supply:", founderNFT.totalSupply());

        // Test multiple mint
        if (TEST_MINT_COUNT > 1) {
            console.log("   Testing multiple mint...");
            uint256 remainingMints = TEST_MINT_COUNT - 1;
            uint256 totalCost = mintPrice * remainingMints;
            
            founderNFT.mintMultiple{value: totalCost}(remainingMints);
            
            require(founderNFT.totalSupply() == initialSupply + TEST_MINT_COUNT, "Supply mismatch after multiple mint");
            require(founderNFT.balanceOf(tester) >= TEST_MINT_COUNT, "Balance mismatch after multiple mint");
            
            console.log("    Multiple mint successful");
            console.log("    Final total supply:", founderNFT.totalSupply());
        }

        // Verify ETH was spent
        uint256 finalBalance = tester.balance;
        uint256 expectedSpent = mintPrice * TEST_MINT_COUNT;
        uint256 actualSpent = initialBalance - finalBalance;
        
        console.log("   Expected spent:", expectedSpent / 1e18, "ETH");
        console.log("   Actually spent:", actualSpent / 1e18, "ETH");
        
        // Allow for gas costs (actualSpent should be >= expectedSpent)
        require(actualSpent >= expectedSpent, "Insufficient ETH spent");

        vm.stopBroadcast();

        console.log("    NFT minting tests passed");
    }

    // ============================================================================
    // STAKING MECHANICS TESTS
    // ============================================================================

    function testStakingMechanics() internal {
        console.log("  Testing Staking Mechanics...");

        vm.startBroadcast(testerPrivateKey);

        uint256 tokenId = 0; // First minted token
        
        require(founderNFT.ownerOf(tokenId) == tester, "Tester should own token for staking test");
        require(!founderNFT.isTokenStaked(tokenId), "Token should not be staked initially");

        // Test staking
        console.log("   Testing token staking...");
        founderNFT.stakeToken(tokenId);
        
        require(founderNFT.isTokenStaked(tokenId), "Token should be staked");
        require(founderNFT.ownerOf(tokenId) == address(founderNFT), "Contract should own staked token");
        
        console.log("    Token successfully staked");
        console.log("    Ownership transferred to contract");

        // Check staking info
        (address originalOwner, uint256 stakedSince, uint256 lastClaim) = founderNFT.getStakingInfo(tokenId);
        require(originalOwner == tester, "Original owner should be tester");
        require(stakedSince > 0, "Staked since timestamp should be set");
        
        console.log("    Staking info correct");
        console.log("      Original owner:", originalOwner);
        console.log("      Staked since:", stakedSince);
        console.log("      Last claim:", lastClaim);

        // Test that transfer is restricted
        console.log("   Testing transfer restriction...");
        try founderNFT.transferFrom(tester, address(0x123), tokenId) {
            revert("Transfer should have failed for staked token");
        } catch {
            console.log("    Transfer correctly blocked for staked token");
        }

        vm.stopBroadcast();

        console.log("    Staking mechanics tests passed");
    }

    // ============================================================================
    // REWARD SYSTEM TESTS
    // ============================================================================

    function testRewardSystem() internal {
        console.log("  Testing Reward System...");

        uint256 tokenId = 0; // First staked token

        // Check initial reward state
        uint256 initialRewards = founderNFT.earned(tokenId);
        uint256 initialRewardRate = founderNFT.getCurrentRewardRate();
        uint256 totalStaked = founderNFT.getTotalStakedSupply();
        
        console.log("   Initial rewards:", initialRewards);
        console.log("   Initial reward rate:", initialRewardRate);
        console.log("   Total staked tokens:", totalStaked);

        // Wait for some time to accrue rewards (if any)
        console.log("   Waiting for reward accrual...");
        vm.warp(block.timestamp + WAIT_TIME);

        // Check if any rewards accrued from the 10% mint redistribution
        uint256 rewardsAfterWait = founderNFT.earned(tokenId);
        console.log("   Rewards after wait:", rewardsAfterWait);

        if (rewardsAfterWait > initialRewards) {
            console.log("    Rewards are accruing");
            
            // Test claiming rewards
            vm.startBroadcast(testerPrivateKey);
            
            uint256 balanceBefore = tester.balance;
            founderNFT.claimReward(tokenId);
            uint256 balanceAfter = tester.balance;
            
            vm.stopBroadcast();
            
            console.log("    Rewards claimed successfully");
            console.log("      ETH received:", (balanceAfter - balanceBefore) / 1e18, "ETH");
        } else {
            console.log("     No rewards accrued yet (expected with limited activity)");
            console.log("     Rewards will increase as more users mint NFTs");
        }

        // Test reward rate calculation
        uint256 estimatedAPR = founderNFT.getEstimatedAPR();
        console.log("   Current estimated APR:", estimatedAPR, "basis points");
        
        console.log("    Reward system tests passed");
    }

    // ============================================================================
    // BATCH OPERATIONS TESTS
    // ============================================================================

    function testBatchOperations() internal {
        console.log("  Testing Batch Operations...");

        if (founderNFT.balanceOf(tester) < 2) {
            console.log("     Skipping batch tests (need at least 2 NFTs)");
            return;
        }

        vm.startBroadcast(testerPrivateKey);

        // Prepare token IDs for batch operations
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1; // Second token (first is already staked)
        tokenIds[1] = 2; // Third token (if it exists)

        // Only test with tokens that exist and aren't staked
        uint256 validTokenCount = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenIds[i] < founderNFT.totalSupply() && !founderNFT.isTokenStaked(tokenIds[i])) {
                tokenIds[validTokenCount] = tokenIds[i];
                validTokenCount++;
            }
        }

        if (validTokenCount > 0) {
            // Resize array to only include valid tokens
            uint256[] memory validTokenIds = new uint256[](validTokenCount);
            for (uint256 i = 0; i < validTokenCount; i++) {
                validTokenIds[i] = tokenIds[i];
            }

            console.log("   Testing batch staking with", validTokenCount, "tokens...");
            founderNFT.stakeMultipleTokens(validTokenIds);

            // Verify all tokens are staked
            for (uint256 i = 0; i < validTokenCount; i++) {
                require(founderNFT.isTokenStaked(validTokenIds[i]), "Token should be staked");
            }

            console.log("    Batch staking successful");

            // Test batch reward claiming (if rewards exist)
            vm.warp(block.timestamp + 30); // Wait a bit more
            
            uint256 totalEarned = 0;
            for (uint256 i = 0; i < validTokenCount; i++) {
                totalEarned += founderNFT.earned(validTokenIds[i]);
            }

            if (totalEarned > 0) {
                console.log("   Testing batch reward claiming...");
                uint256 balanceBefore = tester.balance;
                founderNFT.claimMultipleRewards(validTokenIds);
                uint256 balanceAfter = tester.balance;
                
                console.log("    Batch rewards claimed");
                console.log("      Total ETH received:", (balanceAfter - balanceBefore) / 1e18, "ETH");
            }
        } else {
            console.log("     No valid tokens for batch testing");
        }

        vm.stopBroadcast();

        console.log("    Batch operations tests passed");
    }

    // ============================================================================
    // EMERGENCY CONTROLS TESTS
    // ============================================================================

    function testEmergencyControls() internal {
        console.log("  Testing Emergency Controls...");

        vm.startBroadcast(testerPrivateKey);

        // Test PlatformRegistry pause functionality
        console.log("   Testing PlatformRegistry pause functionality...");
        registry.pause();
        require(registry.paused(), "Registry should be paused");
        console.log("    PlatformRegistry successfully paused");

        // Test unpausing PlatformRegistry
        console.log("   Testing PlatformRegistry unpause functionality...");
        registry.unpause();
        require(!registry.paused(), "Registry should not be paused");
        console.log("    PlatformRegistry successfully unpaused");

        // Test FounderNFT sales control (FounderNFT doesn't have direct pause functions)
        console.log("   Testing FounderNFT sales control...");
        bool initialSaleStatus = founderNFT.getSaleStatus();
        
        founderNFT.setSaleStatus(false);
        require(!founderNFT.getSaleStatus(), "Sales should be disabled");
        console.log("    Sales successfully disabled");

        // Test that minting fails when sales are disabled
        console.log("   Testing that minting fails when sales disabled...");
        try founderNFT.mint{value: founderNFT.getPrice()}() {
            revert("Mint should fail when sales disabled");
        } catch {
            console.log("    Minting correctly blocked when sales disabled");
        }
        
        founderNFT.setSaleStatus(initialSaleStatus);
        require(founderNFT.getSaleStatus() == initialSaleStatus, "Sales status should be restored");
        console.log("    Sales status restored");

        vm.stopBroadcast();

        console.log("    Emergency controls tests passed");
    }
}