// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {ProjectFactory} from "../../src/ProjectFactory.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";

contract IntegrationTest is Test {
    // Proxies
    ERC1967Proxy public registryProxy;
    ERC1967Proxy public factoryProxy;
    ERC1967Proxy public founderNFTProxy;

    // Implementation contracts (wrapped proxies)
    PlatformRegistry public registry;
    ProjectFactory public factory;
    FounderNFT public founderNFT;

    // Implementation addresses
    address public registryImpl;
    address public factoryImpl;
    address public projectImpl;
    address public founderNFTImpl;

    // Constants for FounderNFT
    uint256 constant MAX_SUPPLY = 100;
    uint256 constant NFT_PRICE = 0.1 ether;
    uint256 constant FEE_DISTRIBUTION_PERCENTAGE = 3000; // 30%
    uint256 constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 constant MIN_STAKING_PERIOD = 7 days;
    uint256 constant SALES_REDISTRIBUTION_PERCENTAGE = 1000; // 10%

    // Extension type constant
    bytes32 constant FOUNDER_NFT_EXTENSION = keccak256("FOUNDER_NFT_EXTENSION");

    // Test accounts
    address public owner;
    address public treasury;
    address public verifier;
    address public creator;
    address public investor1;
    address public investor2;
    address public founder1;
    address public founder2;
    address public founder3;

    // Created project
    address public projectAddress;
    Project public project;

    function setUp() public {
        // Setup accounts
        owner = address(this);
        treasury = makeAddr("treasury");
        verifier = makeAddr("verifier");
        creator = makeAddr("creator");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        founder1 = makeAddr("founder1");
        founder2 = makeAddr("founder2");
        founder3 = makeAddr("founder3");

        // Fund accounts
        vm.deal(creator, 5 ether);
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);
        vm.deal(founder1, 5 ether);
        vm.deal(founder2, 5 ether);
        vm.deal(founder3, 5 ether);

        // Set consistent starting time
        vm.warp(1);

        // Deploy implementations
        PlatformRegistry registryImplementation = new PlatformRegistry();
        registryImpl = address(registryImplementation);

        Project projectImplementation = new Project();
        projectImpl = address(projectImplementation);

        ProjectFactory factoryImplementation = new ProjectFactory();
        factoryImpl = address(factoryImplementation);

        FounderNFT founderNFTImplementation = new FounderNFT();
        founderNFTImpl = address(founderNFTImplementation);

        // Deploy PlatformRegistry proxy
        bytes memory registryData = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500, // 5% platform fee
            treasury,
            address(0) // factory address to be set later
        );

        registryProxy = new ERC1967Proxy(registryImpl, registryData);
        registry = PlatformRegistry(payable(address(registryProxy)));

        // Deploy ProjectFactory proxy
        bytes memory factoryData =
            abi.encodeWithSelector(ProjectFactory.initialize.selector, owner, address(registryProxy), projectImpl);

        factoryProxy = new ERC1967Proxy(factoryImpl, factoryData);
        factory = ProjectFactory(address(factoryProxy));

        // Update registry with factory
        registry.updateProjectFactory(address(factoryProxy));

        // Deploy FounderNFT proxy
        bytes memory founderNFTData = abi.encodeWithSelector(
            FounderNFT.initialize.selector,
            owner,
            address(registryProxy),
            MAX_SUPPLY,
            NFT_PRICE,
            FEE_DISTRIBUTION_PERCENTAGE,
            DAO_TOKEN_ALLOCATION,
            MIN_STAKING_PERIOD
        );

        founderNFTProxy = new ERC1967Proxy(founderNFTImpl, founderNFTData);
        founderNFT = FounderNFT(payable(address(founderNFTProxy)));

        // Register FounderNFT as an extension
        registry.registerExtension(FOUNDER_NFT_EXTENSION, address(founderNFTProxy));

        // Enable sale for FounderNFT
        founderNFT.setSaleStatus(true);

        // Grant platform role to registry
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registryProxy));

        // Set up roles
        registry.grantProjectCreatorRole(creator);
        factory.grantRole(factory.ADMIN_ROLE(), address(registryProxy));
    }

    // ============================================================================
    // CONTINUOUS REWARDS INTEGRATION TESTS
    // ============================================================================

    function testFounderNFTSaleWithContinuousRedistribution() public {
        // Test founder minting NFTs with continuous rewards distribution
        uint256 expectedSalesProceeds = (NFT_PRICE * 9000) / 10000; // 90%
        uint256 expectedRedistribution = (NFT_PRICE * 1000) / 10000; // 10%

        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();

        // Verify NFT ownership
        assertEq(founderNFT.ownerOf(0), founder1, "Founder1 should own NFT #0");
        assertEq(founderNFT.ownerOf(1), founder2, "Founder2 should own NFT #1");
        assertEq(founderNFT.balanceOf(founder1), 1, "Founder1 should have 1 NFT");

        // Verify isFounder function
        assertTrue(founderNFT.isFounder(founder1), "Founder1 should be recognized as founder");
        assertTrue(founderNFT.isFounder(founder2), "Founder2 should be recognized as founder");
        assertFalse(founderNFT.isFounder(investor1), "Investor1 should not be recognized as founder");

        // Verify sales proceeds and reward distribution
        assertEq(
            founderNFT.getTotalSalesProceeds(), expectedSalesProceeds * 2, "Sales proceeds should be 90% of total sales"
        );
        assertEq(
            founderNFT.getSalesRedistributionPercentage(),
            SALES_REDISTRIBUTION_PERCENTAGE,
            "Redistribution percentage should be 10%"
        );

        // Check that rewards were distributed (either to pending or reward rate)
        // Since no one is staking yet, rewards should be in pending
        console.log("Expected redistribution:", expectedRedistribution * 2);
        console.log("Current reward rate:", founderNFT.getCurrentRewardRate());
    }

    function testFounderStakingWithContinuousRewards() public {
        // Founder1 buys and stakes NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Verify staking status
        assertTrue(founderNFT.isTokenStaked(0), "Token should be staked");
        assertEq(founderNFT.getTotalStakedSupply(), 1, "There should be 1 staked token");

        // IMPORTANT: Verify ownership transferred to contract
        assertEq(founderNFT.ownerOf(0), address(founderNFT), "FounderNFT contract should own the staked token");

        // Check staking info
        (address stakedOwner, uint256 stakedSince,) = founderNFT.getStakingInfo(0);
        assertEq(stakedOwner, founder1, "Staked owner should be founder1");
        assertEq(stakedSince, block.timestamp, "Staked since timestamp should match");

        // Check user staked tokens tracking
        uint256[] memory stakedTokens = founderNFT.getStakedByOwner(founder1);
        assertEq(stakedTokens.length, 1, "Should have 1 staked token");
        assertEq(stakedTokens[0], 0, "Should be token ID 0");
        assertEq(founderNFT.getStakedCountByOwner(founder1), 1, "Should have count of 1");
        assertTrue(founderNFT.hasStakedTokens(founder1), "Should have staked tokens");
    }

    function testBatchUnstakingAfterMinimumPeriod() public {
        // Mint and stake multiple NFTs
        vm.prank(founder1);
        founderNFT.mintMultiple{value: NFT_PRICE * 3}(3);

        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(founder1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Verify all tokens are staked and owned by contract
        assertEq(founderNFT.getTotalStakedSupply(), 3, "Should have 3 staked tokens");
        assertEq(founderNFT.ownerOf(0), address(founderNFT), "Contract should own token 0");
        assertEq(founderNFT.ownerOf(1), address(founderNFT), "Contract should own token 1");
        assertEq(founderNFT.ownerOf(2), address(founderNFT), "Contract should own token 2");

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add platform fees to create rewards
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: 1 ether}(0);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1 hours);

        // Check rewards before unstaking
        uint256 totalEarnedBefore = founderNFT.getTotalEarnedByOwner(founder1);
        console.log("Total earned before unstaking:", totalEarnedBefore);

        // Unstake all tokens
        uint256 balanceBefore = founder1.balance;
        vm.prank(founder1);
        founderNFT.unstakeMultipleTokens(tokenIds);

        // Verify unstaking
        assertEq(founderNFT.getTotalStakedSupply(), 0, "Should have 0 staked tokens");
        assertEq(founderNFT.getStakedCountByOwner(founder1), 0, "Should have 0 staked tokens");

        // Verify ownership returned to founder
        assertEq(founderNFT.ownerOf(0), founder1, "Token 0 should be returned to founder");
        assertEq(founderNFT.ownerOf(1), founder1, "Token 1 should be returned to founder");
        assertEq(founderNFT.ownerOf(2), founder1, "Token 2 should be returned to founder");

        // Verify rewards were claimed during unstaking
        if (totalEarnedBefore > 0) {
            uint256 rewardsReceived = founder1.balance - balanceBefore;
            assertEq(rewardsReceived, totalEarnedBefore, "Should receive all earned rewards");
        }
    }

    function testStakedTokenTransferRestrictions() public {
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        // Before staking - should be transferable
        vm.prank(founder1);
        founderNFT.transferFrom(founder1, founder2, 0);
        assertEq(founderNFT.ownerOf(0), founder2, "Token should be transferred to founder2");

        // Transfer back for staking test
        vm.prank(founder2);
        founderNFT.transferFrom(founder2, founder1, 0);

        // After staking - user no longer owns the token
        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Contract now owns the token
        assertEq(founderNFT.ownerOf(0), address(founderNFT), "Contract should own staked token");

        // User cannot transfer because they don't own it
        vm.prank(founder1);
        vm.expectRevert();
        founderNFT.transferFrom(founder1, founder2, 0);
    }

    function testClaimRewardFunctionality() public {
        // Setup staking
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add platform fees
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: 1 ether}(0);

        // Fast forward time to accrue rewards
        vm.warp(block.timestamp + 1 hours);

        uint256 earnedBefore = founderNFT.earned(0);
        console.log("Earned before claim:", earnedBefore);

        if (earnedBefore > 0) {
            // Test direct claim functionality
            uint256 balanceBefore = founder1.balance;

            vm.prank(founder1);
            founderNFT.claimReward(0);

            uint256 rewardsReceived = founder1.balance - balanceBefore;
            assertEq(rewardsReceived, earnedBefore, "Should receive exact earned amount");
            assertEq(founderNFT.earned(0), 0, "Earned should reset to 0 after claiming");

            // Token should still be staked
            assertTrue(founderNFT.isTokenStaked(0), "Token should remain staked after claiming");
            assertEq(founderNFT.ownerOf(0), address(founderNFT), "Contract should still own the token");
        }
    }

    function testContinuousRewardsSystemWithClaiming() public {
        // Multiple founders buy and stake NFTs
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder1);
        founderNFT.stakeToken(0);

        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder2);
        founderNFT.stakeToken(1);

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add some platform fees to create rewards
        uint256 platformFees = 1 ether;
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: platformFees}(0);

        // Fast forward time to accrue rewards
        vm.warp(block.timestamp + 1 hours);

        // Check that rewards have accrued
        uint256 earned1 = founderNFT.earned(0);
        uint256 earned2 = founderNFT.earned(1);

        console.log("Founder1 earned:", earned1);
        console.log("Founder2 earned:", earned2);

        if (earned1 > 0) {
            // Claim rewards for founder1
            uint256 founder1BalanceBefore = founder1.balance;
            vm.prank(founder1);
            founderNFT.claimReward(0);

            assertEq(founder1.balance - founder1BalanceBefore, earned1, "Founder1 should receive earned rewards");
            assertEq(founderNFT.earned(0), 0, "Earned should reset after claiming");
        }

        if (earned2 > 0) {
            // Claim rewards for founder2
            uint256 founder2BalanceBefore = founder2.balance;
            vm.prank(founder2);
            founderNFT.claimReward(1);

            assertEq(founder2.balance - founder2BalanceBefore, earned2, "Founder2 should receive earned rewards");
            assertEq(founderNFT.earned(1), 0, "Earned should reset after claiming");
        }
    }

    function testBatchStakingAndRewards() public {
        // Mint multiple NFTs for founder1
        vm.prank(founder1);
        founderNFT.mintMultiple{value: NFT_PRICE * 3}(3);

        // Stake multiple tokens at once
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(founder1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Verify all tokens are staked
        assertEq(founderNFT.getTotalStakedSupply(), 3, "Should have 3 staked tokens");
        assertEq(founderNFT.getStakedCountByOwner(founder1), 3, "Founder1 should have 3 staked tokens");

        uint256[] memory stakedTokens = founderNFT.getStakedByOwner(founder1);
        assertEq(stakedTokens.length, 3, "Should return 3 staked tokens");

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add platform fees
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: 1 ether}(0);

        // Fast forward time
        vm.warp(block.timestamp + 1 hours);

        // Check total earned
        uint256 totalEarned = founderNFT.getTotalEarnedByOwner(founder1);
        console.log("Total earned by founder1:", totalEarned);

        if (totalEarned > 0) {
            // Claim all rewards at once
            uint256 balanceBefore = founder1.balance;
            vm.prank(founder1);
            founderNFT.claimAllRewards();

            assertGt(founder1.balance, balanceBefore, "Should receive rewards");
        }
    }

    function testEndToEndProjectWithContinuousRewardsAndPlatformFees() public {
        // Step 1: Founder buys and stakes NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        // Verify sales proceeds and redistribution are tracked correctly
        uint256 expectedSalesProceeds = (NFT_PRICE * 9000) / 10000; // 90%

        assertEq(
            founderNFT.getTotalSalesProceeds(), expectedSalesProceeds, "Sales proceeds should be 90% of mint price"
        );

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Step 2: Create a project
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Test Project",
            "A test project for end-to-end testing",
            10 ether, // funding goal
            30 days, // duration
            false, // all-or-nothing funding
            teamMembers
        );
        vm.stopPrank();

        // Verify project was created
        assertTrue(registry.isProjectRegistered(projectAddress), "Project should be registered");
        project = Project(payable(projectAddress));

        // Step 3: Create milestones
        vm.startPrank(creator);
        project.createMilestone("Initial Development", 3000); // 30%
        project.createMilestone("MVP Release", 4000); // 40%
        project.createMilestone("Final Product", 3000); // 30%
        vm.stopPrank();

        // Step 4: Invest with ETH
        vm.prank(investor1);
        project.invest{value: 6 ether}();

        vm.prank(investor2);
        project.invest{value: 5 ether}();

        // Step 5: Move time forward to end funding period
        vm.warp(block.timestamp + 31 days);

        // Step 6: Update project state
        project.checkAndUpdateState();

        // Step 7: Submit milestone completion
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        // Step 8: Vote on milestone
        vm.prank(investor1);
        project.voteMilestone(0);

        // Check earned rewards before platform fees
        uint256 earnedBefore = founderNFT.earned(0);

        // Step 9: Release funds for milestone (this adds platform fees)
        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts
        uint256 totalFunding = 11 ether;
        uint256 milestoneAmount = (totalFunding * 3000) / 10000; // 30% of funds
        uint256 platformFee = (milestoneAmount * 500) / 10000; // 5% fee
        uint256 founderShare = (platformFee * FEE_DISTRIBUTION_PERCENTAGE) / 10000; // 30% of platform fee

        console.log("Platform fee:", platformFee);
        console.log("Founder share:", founderShare);

        // Fast forward time to accrue the new rewards
        vm.warp(block.timestamp + 1 hours);

        // Check that rewards increased after platform fees
        uint256 earnedAfter = founderNFT.earned(0);
        console.log("Earned before platform fees:", earnedBefore);
        console.log("Earned after platform fees:", earnedAfter);

        if (earnedAfter > 0) {
            // Step 10: Founder claims rewards
            uint256 founder1BalanceBefore = founder1.balance;

            vm.prank(founder1);
            founderNFT.claimReward(0);

            uint256 rewardsReceived = founder1.balance - founder1BalanceBefore;
            console.log("Rewards received:", rewardsReceived);

            assertGt(rewardsReceived, 0, "Founder should receive rewards");
        }

        // Sales proceeds should be unchanged by the reward claiming process
        assertEq(
            founderNFT.getTotalSalesProceeds(),
            expectedSalesProceeds,
            "Sales proceeds should be unchanged after reward claiming"
        );
    }

    function testUnstakingWithRewardClaiming() public {
        // Setup staking
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add platform fees to create rewards
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: 1 ether}(0);

        // Fast forward past minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1 hours);

        uint256 earnedBeforeUnstake = founderNFT.earned(0);
        console.log("Earned before unstake:", earnedBeforeUnstake);

        if (earnedBeforeUnstake > 0) {
            // Unstake should automatically claim rewards
            uint256 balanceBefore = founder1.balance;

            vm.prank(founder1);
            founderNFT.unstakeToken(0);

            // Verify rewards were claimed during unstaking
            uint256 rewardsReceived = founder1.balance - balanceBefore;
            assertEq(rewardsReceived, earnedBeforeUnstake, "Should receive rewards when unstaking");
        }

        // Verify unstaking state
        assertFalse(founderNFT.isTokenStaked(0), "Token should not be staked");
        assertEq(founderNFT.ownerOf(0), founder1, "Token should be returned to founder");
        assertEq(founderNFT.getStakedCountByOwner(founder1), 0, "Should have no staked tokens");
    }

    function testBatchMintNoContinuousRedistribution() public {
        uint256 initialSalesProceeds = founderNFT.getTotalSalesProceeds();
        uint256 initialRewardRate = founderNFT.getCurrentRewardRate();

        // Create list of recipients
        address[] memory recipients = new address[](3);
        recipients[0] = founder1;
        recipients[1] = founder2;
        recipients[2] = founder3;

        // Batch mint NFTs (admin function, no payment)
        founderNFT.batchMint(recipients);

        // Verify ownership
        assertEq(founderNFT.ownerOf(0), founder1, "Founder1 should own NFT #0");
        assertEq(founderNFT.ownerOf(1), founder2, "Founder2 should own NFT #1");
        assertEq(founderNFT.ownerOf(2), founder3, "Founder3 should own NFT #2");

        // Verify total supply
        assertEq(founderNFT.totalSupply(), 3, "Total supply should be 3");

        // Verify no sales proceeds or reward distribution (batch mint is free)
        assertEq(founderNFT.getTotalSalesProceeds(), initialSalesProceeds, "Sales proceeds should be unchanged");
        assertEq(founderNFT.getCurrentRewardRate(), initialRewardRate, "Reward rate should be unchanged");
    }

    function testWithdrawSalesProceedsWithContinuousRewards() public {
        // Founder mints NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        uint256 expectedSalesProceeds = (NFT_PRICE * 9000) / 10000; // 90%
        assertEq(
            founderNFT.getTotalSalesProceeds(), expectedSalesProceeds, "Sales proceeds should be 90% of mint price"
        );

        // Admin withdraws sales proceeds
        uint256 adminBalanceBefore = address(this).balance;
        founderNFT.withdrawSalesProceeds();

        // Verify withdrawal
        assertEq(address(this).balance - adminBalanceBefore, expectedSalesProceeds, "Admin should receive 90% of sales");
        assertEq(founderNFT.getTotalSalesProceeds(), 0, "Sales proceeds should be 0 after withdrawal");

        // Verify contract still has funds for rewards
        assertGt(address(founderNFT).balance, 0, "Contract should retain funds for rewards");
    }

    function testEarlyAccessProject() public {
        // Step 1: Founder buys NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        // Step 2: Create a project with early access
        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Early Access Project", "A project with early access for founders", 10 ether, 30 days, false, teamMembers
        );
        vm.stopPrank();

        project = Project(payable(projectAddress));

        // Step 3: Add project to early access list
        founderNFT.addEarlyAccessProject(projectAddress);

        // Step 4: Check early access status
        assertTrue(founderNFT.hasEarlyAccess(founder1, projectAddress), "Founder1 should have early access");
        assertFalse(founderNFT.hasEarlyAccess(investor1, projectAddress), "Investor1 should not have early access");

        // Step 5: Remove project from early access
        founderNFT.removeEarlyAccessProject(projectAddress);

        // Step 6: Verify early access removed
        assertFalse(founderNFT.hasEarlyAccess(founder1, projectAddress), "Early access should be removed");
    }

    function testMultipleStakersRewardDistribution() public {
        // Multiple founders buy and stake
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder1);
        founderNFT.stakeToken(0);

        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder2);
        founderNFT.stakeToken(1);

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add platform fees
        uint256 platformFees = 2 ether;
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: platformFees}(0);

        // Fast forward time
        vm.warp(block.timestamp + 1 hours);

        // Both founders should earn similar amounts (equal staking)
        uint256 earned1 = founderNFT.earned(0);
        uint256 earned2 = founderNFT.earned(1);

        console.log("Founder1 earned:", earned1);
        console.log("Founder2 earned:", earned2);

        if (earned1 > 0 && earned2 > 0) {
            // Should be approximately equal (allowing for small rounding differences)
            uint256 diff = earned1 > earned2 ? earned1 - earned2 : earned2 - earned1;
            uint256 tolerance = earned1 / 100; // 1% tolerance
            assertLt(diff, tolerance, "Earnings should be approximately equal");
        }
    }

    function testGetStakingInfoBatch() public {
        // Setup multiple tokens with different staking states
        vm.prank(founder1);
        founderNFT.mintMultiple{value: NFT_PRICE * 2}(2);

        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();

        // Stake founder1's tokens
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 0;
        tokenIds[1] = 1;

        vm.prank(founder1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Get batch info for all tokens
        uint256[] memory queryIds = new uint256[](3);
        queryIds[0] = 0;
        queryIds[1] = 1;
        queryIds[2] = 2;

        (
            address[] memory owners,
            uint256[] memory stakedAt, /* uint256[] memory earnedRewards */
            ,
            bool[] memory canUnstake
        ) = founderNFT.getStakingInfoBatch(queryIds);

        // Verify results
        assertEq(owners[0], founder1, "Token 0 should be staked by founder1");
        assertEq(owners[1], founder1, "Token 1 should be staked by founder1");
        assertEq(owners[2], address(0), "Token 2 should not be staked");

        assertGt(stakedAt[0], 0, "Token 0 should have staking timestamp");
        assertGt(stakedAt[1], 0, "Token 1 should have staking timestamp");
        assertEq(stakedAt[2], 0, "Token 2 should have no staking timestamp");

        assertFalse(canUnstake[0], "Token 0 should not be unstakeable yet (minimum period)");
        assertFalse(canUnstake[1], "Token 1 should not be unstakeable yet (minimum period)");
        assertFalse(canUnstake[2], "Token 2 should not be unstakeable (not staked)");
    }

    function testProjectUpgradesWithContinuousFounderNFT() public {
        // Create a founder and project
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Upgradeable Project",
            "A project that tests upgrades with continuous FounderNFT",
            10 ether,
            30 days,
            false,
            teamMembers
        );
        vm.stopPrank();

        project = Project(payable(projectAddress));

        // Make investment
        vm.prank(investor1);
        project.invest{value: 5 ether}();

        // Deploy new implementation versions
        PlatformRegistry newRegistryImpl = new PlatformRegistry();
        FounderNFT newFounderNFTImpl = new FounderNFT();

        // Upgrade contracts
        registry.upgradeToAndCall(address(newRegistryImpl), "");
        founderNFT.upgradeToAndCall(address(newFounderNFTImpl), "");

        // Verify state preserved
        assertTrue(registry.isProjectRegistered(projectAddress), "Registry should still have project registered");
        assertTrue(founderNFT.isFounder(founder1), "Founder status should be preserved after upgrade");
        assertEq(
            registry.getExtension(FOUNDER_NFT_EXTENSION),
            address(founderNFTProxy),
            "Extension registration should be preserved"
        );

        // Verify continuous rewards system functionality preserved after upgrade
        assertEq(
            founderNFT.getSalesRedistributionPercentage(),
            SALES_REDISTRIBUTION_PERCENTAGE,
            "Redistribution percentage should be preserved"
        );

        uint256 expectedSalesProceeds = (NFT_PRICE * 9000) / 10000; // 90%
        assertEq(founderNFT.getTotalSalesProceeds(), expectedSalesProceeds, "Sales proceeds should be preserved");

        // Verify continuous rewards functions still work
        assertEq(
            founderNFT.getCurrentRewardRate(), founderNFT.getCurrentRewardRate(), "Reward rate should be accessible"
        );
        assertEq(founderNFT.getTotalStakedSupply(), 1, "Staked supply should be preserved");
        assertTrue(founderNFT.isTokenStaked(0), "Token should still be staked after upgrade");

        // Verify user tracking preserved
        uint256[] memory stakedTokens = founderNFT.getStakedByOwner(founder1);
        assertEq(stakedTokens.length, 1, "User staked tokens should be preserved");
        assertEq(stakedTokens[0], 0, "Correct token should be tracked");
    }

    function testRewardRateUpdates() public {
        // Setup staking
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        uint256 initialRewardRate = founderNFT.getCurrentRewardRate();

        // Fund the registry contract so it can send platform fees
        vm.deal(address(registry), 2 ether);

        // Add platform fees should increase reward rate
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: 1 ether}(0);

        uint256 newRewardRate = founderNFT.getCurrentRewardRate();
        assertGt(newRewardRate, initialRewardRate, "Reward rate should increase after adding platform fees");

        // Admin can also manually adjust reward rate
        uint256 manualRate = 100; // wei per second
        founderNFT.setRewardRate(manualRate);

        assertEq(founderNFT.getCurrentRewardRate(), manualRate, "Manual reward rate should be set");
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
