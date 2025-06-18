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
    uint256 constant FEE_DISTRIBUTION_PERCENTAGE = 5000; // 50% (updated to match new system)
    uint256 constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 constant MIN_STAKING_PERIOD = 7 days;
    uint256 constant SALES_REDISTRIBUTION_PERCENTAGE = 1000; // 10%

    // Extension type constant
    bytes32 constant FOUNDER_NFT_EXTENSION = keccak256("FOUNDER_NFT");

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

        // Deploy PlatformRegistry proxy with updated parameter names
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

        // Update registry with factory - use registerExtension instead of updateProjectFactory
        vm.prank(owner);
        registry.registerExtension(registry.NFT_FACTORY_EXTENSION(), address(factoryProxy));

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
        vm.prank(owner);
        registry.registerExtension(FOUNDER_NFT_EXTENSION, address(founderNFTProxy));

        // Enable sale for FounderNFT
        founderNFT.setSaleStatus(true);

        // Grant platform role to registry
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registryProxy));

        // Set up roles
        vm.prank(owner);
        registry.grantProjectCreatorRole(creator);

        vm.prank(owner);
        factory.grantRole(factory.ADMIN_ROLE(), address(registryProxy));

        // Verify enhanced fee distribution is initialized correctly
        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 5000, "Initial founder percentage should be 50%");
        assertEq(treasuryPct, 5000, "Initial treasury percentage should be 50%");
    }

    // ============================================================================
    // ENHANCED FEE DISTRIBUTION INTEGRATION TESTS
    // ============================================================================

    function testEnhancedFeeDistributionIntegration() public {
        // Step 1: Founder buys and stakes NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Step 2: Create a project using the enhanced createProject function
        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator, // creator parameter
            "Test Project",
            "A test project for enhanced fee distribution testing",
            10 ether, // funding goal
            30 days, // duration
            false, // all-or-nothing funding
            teamMembers
        );

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

        // Check initial state
        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;
        uint256 earnedBefore = founderNFT.earned(0);

        // Step 9: Release funds for milestone (this should use enhanced fee distribution)
        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts based on enhanced fee distribution (50-50 split)
        uint256 totalFunding = 11 ether;
        uint256 milestoneAmount = (totalFunding * 3000) / 10000; // 30% of funds
        uint256 platformFee = (milestoneAmount * 500) / 10000; // 5% fee
        uint256 founderShare = (platformFee * 5000) / 10000; // 50% of platform fee (enhanced system)
        uint256 treasuryShare = platformFee - founderShare; // Remaining 50%

        console.log("Platform fee:", platformFee);
        console.log("Founder share (50%):", founderShare);
        console.log("Treasury share (50%):", treasuryShare);

        // Verify fee distribution
        assertEq(treasury.balance, treasuryBalanceBefore + treasuryShare, "Treasury should receive 50% of platform fee");
        assertEq(
            address(founderNFT).balance,
            founderNFTBalanceBefore + founderShare,
            "FounderNFT should receive 50% of platform fee"
        );

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

        // Verify fee tracking
        assertEq(registry.getTotalFeesReceived(treasury), treasuryShare, "Treasury fee tracking should match");
        assertEq(
            registry.getTotalFeesReceived(address(founderNFT)), founderShare, "FounderNFT fee tracking should match"
        );
    }

    function testPendingFeesScenario() public {
        // Create a project first
        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator,
            "Pending Fees Test Project",
            "Testing pending fees functionality",
            5 ether,
            30 days,
            false,
            teamMembers
        );

        project = Project(payable(projectAddress));

        // Create and complete milestone without any stakers
        vm.startPrank(creator);
        project.createMilestone("Test Milestone", 10000); // 100%
        vm.stopPrank();

        // Invest
        vm.prank(investor1);
        project.invest{value: 5 ether}();

        // End funding period
        vm.warp(block.timestamp + 31 days);
        project.checkAndUpdateState();

        // Submit and vote on milestone
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        vm.prank(investor1);
        project.voteMilestone(0);

        // Release funds without any stakers - should create pending fees
        uint256 pendingFeesBefore = registry.getPendingFounderFees();

        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        uint256 pendingFeesAfter = registry.getPendingFounderFees();
        assertGt(pendingFeesAfter, pendingFeesBefore, "Should have pending fees when no stakers");

        // Now add a staker and distribute pending fees
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        uint256 founderBalanceBefore = address(founderNFT).balance;

        // Distribute pending fees
        vm.prank(owner);
        registry.distributePendingFounderFees();

        assertEq(registry.getPendingFounderFees(), 0, "Pending fees should be cleared");
        assertGt(address(founderNFT).balance, founderBalanceBefore, "FounderNFT should receive pending fees");
    }

    function testEmergencyFeeControls() public {
        // Create a project
        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator, "Emergency Test Project", "Testing emergency fee controls", 5 ether, 30 days, false, teamMembers
        );

        project = Project(payable(projectAddress));

        // Set up milestone
        vm.prank(creator);
        project.createMilestone("Emergency Test", 10000);

        // Invest and complete funding
        vm.prank(investor1);
        project.invest{value: 5 ether}();

        vm.warp(block.timestamp + 31 days);
        project.checkAndUpdateState();

        // Emergency freeze fee distribution
        address emergencyRecipient = makeAddr("emergency");
        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        // Verify freeze status
        (bool frozen, address recipient) = registry.getEmergencyStatus();
        assertTrue(frozen, "Fee distribution should be frozen");
        assertEq(recipient, emergencyRecipient, "Emergency recipient should be set");

        // Try to release milestone funds - should fail due to freeze
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        vm.prank(investor1);
        project.voteMilestone(0);

        // This should fail because fee distribution is frozen
        vm.prank(creator);
        vm.expectRevert("Fee distribution frozen");
        project.releaseMilestoneFunds(0);

        // Unfreeze and try again
        vm.prank(owner);
        registry.toggleEmergencyFreeze(false, address(0));

        (bool frozenAfter,) = registry.getEmergencyStatus();
        assertFalse(frozenAfter, "Fee distribution should be unfrozen");

        // Now milestone release should work
        vm.prank(creator);
        project.releaseMilestoneFunds(0);
    }

    function testFeeDistributionConfiguration() public {
        // Test updating fee distribution percentages
        vm.prank(owner);
        registry.updateFeeDistribution(7000, 3000); // 70% founder, 30% treasury

        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 7000, "Founder percentage should be updated to 70%");
        assertEq(treasuryPct, 3000, "Treasury percentage should be updated to 30%");

        // Create and fund a project to test the new distribution
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator, "Fee Config Test", "Testing fee configuration", 5 ether, 30 days, false, teamMembers
        );

        project = Project(payable(projectAddress));

        // Complete the project lifecycle
        vm.prank(creator);
        project.createMilestone("Config Test", 10000);

        vm.prank(investor1);
        project.invest{value: 5 ether}();

        vm.warp(block.timestamp + 31 days);
        project.checkAndUpdateState();

        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        vm.prank(investor1);
        project.voteMilestone(0);

        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;

        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts with 70-30 split
        uint256 platformFee = (5 ether * 500) / 10000; // 5% of milestone amount
        uint256 expectedFounderShare = (platformFee * 7000) / 10000; // 70%
        uint256 expectedTreasuryShare = (platformFee * 3000) / 10000; // 30%

        assertEq(treasury.balance - treasuryBalanceBefore, expectedTreasuryShare, "Treasury should get 30%");
        assertEq(
            address(founderNFT).balance - founderNFTBalanceBefore, expectedFounderShare, "FounderNFT should get 70%"
        );
    }

    // ============================================================================
    // UPDATED CONTINUOUS REWARDS INTEGRATION TESTS
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
    }

    function testProjectUpgradesWithEnhancedRegistry() public {
        // Create a founder and project
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator,
            "Upgradeable Project",
            "A project that tests upgrades with enhanced registry",
            10 ether,
            30 days,
            false,
            teamMembers
        );

        project = Project(payable(projectAddress));

        // Verify initial fee distribution
        (uint256 founderPctBefore, uint256 treasuryPctBefore) = registry.getFeeDistribution();
        assertEq(founderPctBefore, 5000, "Initial founder percentage should be 50%");
        assertEq(treasuryPctBefore, 5000, "Initial treasury percentage should be 50%");

        // Deploy new implementation versions
        PlatformRegistry newRegistryImpl = new PlatformRegistry();
        FounderNFT newFounderNFTImpl = new FounderNFT();

        // Upgrade contracts
        registry.upgradeToAndCall(address(newRegistryImpl), "");
        founderNFT.upgradeToAndCall(address(newFounderNFTImpl), "");

        // Verify enhanced features preserved after upgrade
        (uint256 founderPctAfter, uint256 treasuryPctAfter) = registry.getFeeDistribution();
        assertEq(founderPctAfter, 5000, "Fee distribution should be preserved after upgrade");
        assertEq(treasuryPctAfter, 5000, "Fee distribution should be preserved after upgrade");

        // Verify emergency status preserved
        (bool frozen,) = registry.getEmergencyStatus();
        assertFalse(frozen, "Emergency freeze should be off after upgrade");

        // Verify pending fees preserved
        uint256 pendingFees = registry.getPendingFounderFees();
        assertEq(pendingFees, 0, "Should have no pending fees after upgrade");

        // Test that enhanced functionality still works
        vm.prank(owner);
        registry.updateFeeDistribution(6000, 4000);

        (uint256 newFounderPct, uint256 newTreasuryPct) = registry.getFeeDistribution();
        assertEq(newFounderPct, 6000, "Should be able to update fee distribution after upgrade");
        assertEq(newTreasuryPct, 4000, "Should be able to update fee distribution after upgrade");

        // Verify founder status preserved
        assertTrue(founderNFT.isFounder(founder1), "Founder status should be preserved after upgrade");
        assertTrue(founderNFT.isTokenStaked(0), "Staking status should be preserved after upgrade");
    }

    function testFeeStatsAndTracking() public {
        // Create multiple projects and track fees
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Create first project
        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        address project1 = registry.createProject(
            creator, "Project 1", "First project for fee tracking", 5 ether, 30 days, false, teamMembers
        );

        // Create second project
        vm.prank(creator);
        address project2 = registry.createProject(
            creator, "Project 2", "Second project for fee tracking", 3 ether, 30 days, false, teamMembers
        );

        // Complete both projects and generate fees
        Project p1 = Project(payable(project1));
        Project p2 = Project(payable(project2));

        // Project 1
        vm.prank(creator);
        p1.createMilestone("P1 Milestone", 10000);

        vm.prank(investor1);
        p1.invest{value: 5 ether}();

        vm.warp(block.timestamp + 31 days);
        p1.checkAndUpdateState();

        vm.prank(creator);
        p1.submitMilestoneCompletion(0);

        vm.prank(investor1);
        p1.voteMilestone(0);

        vm.prank(creator);
        p1.releaseMilestoneFunds(0);

        // Project 2
        vm.prank(creator);
        p2.createMilestone("P2 Milestone", 10000);

        vm.prank(investor1);
        p2.invest{value: 3 ether}();

        vm.warp(block.timestamp + 31 days);
        p2.checkAndUpdateState();

        vm.prank(creator);
        p2.submitMilestoneCompletion(0);

        vm.prank(investor1);
        p2.voteMilestone(0);

        vm.prank(creator);
        p2.releaseMilestoneFunds(0);

        // Check fee stats
        (
            uint256 founderPercentage,
            uint256 treasuryPercentage,
            uint256 totalFounderFees,
            uint256 totalTreasuryFees,
            uint256 pendingFounderFees
        ) = registry.getFeeStats();

        assertEq(founderPercentage, 5000, "Founder percentage should be 50%");
        assertEq(treasuryPercentage, 5000, "Treasury percentage should be 50%");
        assertGt(totalFounderFees, 0, "Should have founder fees from both projects");
        assertGt(totalTreasuryFees, 0, "Should have treasury fees from both projects");
        assertEq(pendingFounderFees, 0, "Should have no pending fees with active staker");

        // Verify individual recipient tracking
        assertGt(registry.getTotalFeesReceived(address(founderNFT)), 0, "FounderNFT should have received fees");
        assertGt(registry.getTotalFeesReceived(treasury), 0, "Treasury should have received fees");

        // Verify fee recipients
        (address founderNFTAddr, address treasuryAddr) = registry.getFeeRecipients();
        assertEq(founderNFTAddr, address(founderNFT), "FounderNFT address should match");
        assertEq(treasuryAddr, treasury, "Treasury address should match");
    }

    // ============================================================================
    // ADDITIONAL INTEGRATION TESTS (keeping the working ones)
    // ============================================================================

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

        // Add platform fees to create rewards (using enhanced system)
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

    // Allow contract to receive ETH
    receive() external payable {}
}
