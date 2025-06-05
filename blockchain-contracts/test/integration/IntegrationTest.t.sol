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
    uint256 constant WEEK = 7 days;
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

        //Grant role platform to registry
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registry));

        // Grant platform role to registry in FounderNFT
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registryProxy));

        // Set up roles
        registry.grantProjectCreatorRole(creator);
        factory.grantRole(factory.ADMIN_ROLE(), address(registryProxy));
    }

    function testFounderNFTSaleWithWeeklyRedistribution() public {
        // Test founder minting NFTs with weekly sales redistribution
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

        // Verify weekly redistribution accumulation
        assertEq(
            founderNFT.getTotalSalesProceeds(), expectedSalesProceeds * 2, "Sales proceeds should be 90% of total sales"
        );
        assertEq(
            founderNFT.getCurrentWeeklyRewards(),
            expectedRedistribution * 2,
            "Current weekly rewards should be 10% of total sales"
        );
        assertEq(
            founderNFT.getSalesRedistributionPercentage(),
            SALES_REDISTRIBUTION_PERCENTAGE,
            "Redistribution percentage should be 10%"
        );
    }

    function testFounderStakingWithWeeklyRewards() public {
        // Founder1 buys and stakes NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Verify staking status
        assertTrue(founderNFT.isTokenStaked(0), "Token should be staked");
        assertEq(founderNFT.getTotalStakedTokens(), 1, "There should be 1 staked token");

        // Verify ownership transferred to contract
        assertEq(founderNFT.ownerOf(0), address(founderNFT), "FounderNFT contract should own the staked token");

        // Check staking info
        (address stakedOwner, uint256 stakedSince,) = founderNFT.getStakingInfo(0);
        assertEq(stakedOwner, founder1, "Staked owner should be founder1");
        assertEq(stakedSince, block.timestamp, "Staked since timestamp should match");

        // Check staked during current week
        uint256 currentWeek = founderNFT.getCurrentWeek();
        assertTrue(
            founderNFT.tokenStakedDuringWeek(currentWeek, 0), "Token should be marked as staked for current week"
        );
    }

    function testWeeklyEpochSystemWithClaiming() public {
        // Multiple founders buy and stake NFTs
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder1);
        founderNFT.stakeToken(0);

        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder2);
        founderNFT.stakeToken(1);

        uint256 weekToFinalize = founderNFT.getCurrentWeek();
        uint256 expectedWeeklyRewards = (NFT_PRICE * 1000 * 2) / 10000; // 10% of 2 mints

        // Verify weekly rewards accumulated
        assertEq(founderNFT.getCurrentWeeklyRewards(), expectedWeeklyRewards, "Weekly rewards should accumulate");

        // Move to next week and finalize
        vm.warp(block.timestamp + WEEK);
        founderNFT.finalizeWeek();

        // Verify week was finalized
        (uint256 weekRewards, uint256 weekStakers) = founderNFT.getWeekInfo(weekToFinalize);
        assertEq(weekRewards, expectedWeeklyRewards, "Week should have correct rewards");
        assertEq(weekStakers, 2, "Week should have correct staker count");

        // Verify current weekly rewards reset
        assertEq(founderNFT.getCurrentWeeklyRewards(), 0, "Current weekly rewards should reset");

        // Check claimable rewards
        (uint256 weekCount, uint256 totalAmount) = founderNFT.getClaimableRewardsInfo(0);
        assertEq(weekCount, 1, "Should have 1 claimable week");
        assertEq(totalAmount, expectedWeeklyRewards / 2, "Should have half the total rewards");

        // Claim rewards
        uint256 founder1BalanceBefore = founder1.balance;
        vm.prank(founder1);
        founderNFT.claimWeeklyReward(0, weekToFinalize);

        uint256 founder2BalanceBefore = founder2.balance;
        vm.prank(founder2);
        founderNFT.claimWeeklyReward(1, weekToFinalize);

        // Verify equal distribution
        uint256 expectedPerFounder = expectedWeeklyRewards / 2;
        assertEq(founder1.balance - founder1BalanceBefore, expectedPerFounder, "Founder1 should receive equal share");
        assertEq(founder2.balance - founder2BalanceBefore, expectedPerFounder, "Founder2 should receive equal share");
    }

    function testEndToEndProjectWithWeeklyRewardsAndPlatformFees() public {
        // Step 1: Founder buys and stakes NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        // Verify sales proceeds and redistribution are tracked correctly
        uint256 expectedSalesProceeds = (NFT_PRICE * 9000) / 10000; // 90%
        uint256 expectedSalesRedistribution = (NFT_PRICE * 1000) / 10000; // 10%

        assertEq(
            founderNFT.getTotalSalesProceeds(), expectedSalesProceeds, "Sales proceeds should be 90% of mint price"
        );
        assertEq(
            founderNFT.getCurrentWeeklyRewards(),
            expectedSalesRedistribution,
            "Should have 10% sales redistribution in weekly rewards"
        );

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        uint256 initialWeek = founderNFT.getCurrentWeek();

        // Make sure project contracts can call addPlatformFees
        bytes32 PLATFORM_ROLE = founderNFT.PLATFORM_ROLE();
        founderNFT.grantRole(PLATFORM_ROLE, address(registry));

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

        // Step 9: Release funds for milestone (this adds platform fees)
        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts
        uint256 totalFunding = 11 ether;
        uint256 milestoneAmount = (totalFunding * 3000) / 10000; // 30% of funds
        uint256 platformFee = (milestoneAmount * 500) / 10000; // 5% fee
        uint256 founderShare = (platformFee * FEE_DISTRIBUTION_PERCENTAGE) / 10000; // 30% of platform fee

        // Verify platform fees added to weekly rewards
        uint256 expectedTotalWeeklyRewards = expectedSalesRedistribution + founderShare;
        assertEq(
            founderNFT.getCurrentWeeklyRewards(),
            expectedTotalWeeklyRewards,
            "Weekly rewards should include both sales redistribution and platform fees"
        );

        // Step 10: Move to next week and finalize to enable claiming
        vm.warp(WEEK + 100);
        founderNFT.finalizeWeek();

        // Step 11: Founder claims combined rewards (sales redistribution + platform fees)
        uint256 founder1BalanceBefore = founder1.balance;

        vm.prank(founder1);
        founderNFT.claimWeeklyReward(0, initialWeek);

        // Verify founder received combined rewards
        uint256 totalExpectedRewards = expectedSalesRedistribution + founderShare;
        assertEq(
            founder1.balance - founder1BalanceBefore, totalExpectedRewards, "Founder should receive combined rewards"
        );

        // Verify week is marked as claimed
        assertTrue(founderNFT.hasClaimedWeek(initialWeek, 0), "Week should be marked as claimed");

        // Sales proceeds should be unchanged by the claim process
        assertEq(
            founderNFT.getTotalSalesProceeds(),
            expectedSalesProceeds,
            "Sales proceeds should be unchanged after reward claiming"
        );
    }

    function testClaimAllWeeklyRewardsAcrossMultipleWeeks() public {
        // Start at timestamp 1 to avoid edge cases
        vm.warp(1);

        // Week 0: Setup
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();
        vm.prank(founder1);
        founderNFT.stakeToken(0);

        //uint256 week1 = founderNFT.getCurrentWeek();
        uint256 week1Rewards = (NFT_PRICE * 1000) / 10000;

        // Move to week 1 and finalize week 0
        vm.warp(WEEK + 100); // Move well into next week
        founderNFT.finalizeWeek();

        // Week 1: Add more rewards
        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();

        //uint256 week2 = founderNFT.getCurrentWeek();
        uint256 week2Rewards = (NFT_PRICE * 1000) / 10000;

        // Move to week 2 and finalize week 1
        vm.warp(WEEK * 2 + 100); // Move well into week 2
        founderNFT.finalizeWeek();

        // Check claimable info
        (uint256 weekCount, uint256 totalAmount) = founderNFT.getClaimableRewardsInfo(0);
        assertEq(weekCount, 2, "Should have 2 claimable weeks");
        assertEq(totalAmount, week1Rewards + week2Rewards, "Should have total of both weeks");

        // Claim all weeks at once
        uint256 founder1BalanceBefore = founder1.balance;
        vm.prank(founder1);
        founderNFT.claimAllWeeklyRewards(0);

        uint256 expectedTotal = week1Rewards + week2Rewards;
        assertEq(founder1.balance - founder1BalanceBefore, expectedTotal, "Should receive all accumulated rewards");

        // Verify no more claimable rewards
        (uint256 remainingWeeks, uint256 remainingAmount) = founderNFT.getClaimableRewardsInfo(0);
        assertEq(remainingWeeks, 0, "Should have no claimable weeks left");
        assertEq(remainingAmount, 0, "Should have no claimable amount left");
    }

    function testBatchMintNoWeeklyRedistribution() public {
        uint256 initialWeeklyRewards = founderNFT.getCurrentWeeklyRewards();
        uint256 initialSalesProceeds = founderNFT.getTotalSalesProceeds();

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

        // Verify no sales proceeds or weekly redistribution (batch mint is free)
        assertEq(founderNFT.getTotalSalesProceeds(), initialSalesProceeds, "Sales proceeds should be unchanged");
        assertEq(founderNFT.getCurrentWeeklyRewards(), initialWeeklyRewards, "Weekly rewards should be unchanged");
    }

    function testWithdrawSalesProceedsAfterWeeklyRedistribution() public {
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

        // Verify weekly redistribution funds remain in contract
        uint256 expectedRedistribution = (NFT_PRICE * 1000) / 10000; // 10%
        assertEq(founderNFT.getCurrentWeeklyRewards(), expectedRedistribution, "Weekly redistribution should remain");
        assertTrue(
            address(founderNFT).balance >= expectedRedistribution, "Contract should retain weekly redistribution funds"
        );
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

    function testProjectUpgradesWithWeeklyFounderNFT() public {
        // Create a founder and project
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Upgradeable Project",
            "A project that tests upgrades with weekly FounderNFT",
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

        // Verify weekly system functionality preserved after upgrade
        assertEq(
            founderNFT.getSalesRedistributionPercentage(),
            SALES_REDISTRIBUTION_PERCENTAGE,
            "Redistribution percentage should be preserved"
        );

        uint256 expectedSalesProceeds = (NFT_PRICE * 9000) / 10000; // 90%
        uint256 expectedRedistribution = (NFT_PRICE * 1000) / 10000; // 10%
        assertEq(founderNFT.getTotalSalesProceeds(), expectedSalesProceeds, "Sales proceeds should be preserved");
        assertEq(founderNFT.getCurrentWeeklyRewards(), expectedRedistribution, "Weekly rewards should be preserved");

        // Verify weekly functions still work
        assertEq(founderNFT.getCurrentWeek(), block.timestamp / WEEK, "getCurrentWeek should work after upgrade");
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
