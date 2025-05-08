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

        // Fund accounts
        vm.deal(creator, 5 ether);
        vm.deal(investor1, 20 ether);
        vm.deal(investor2, 20 ether);
        vm.deal(founder1, 5 ether);
        vm.deal(founder2, 5 ether);

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

    function testFounderNFTSale() public {
        // Test founder minting NFTs
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
    }

    function testFounderStaking() public {
        // Founder buys and stakes NFT
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
    }

    function testEndToEndProjectWithFounderFees() public {
        // Step 1: Founder buys and stakes NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        // Verify sales proceeds are tracked correctly after minting
        assertEq(founderNFT.getTotalSalesProceeds(), NFT_PRICE, "Sales proceeds should match mint price");

        vm.prank(founder1);
        founderNFT.stakeToken(0);

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

        // Verify milestones
        assertEq(project.getMilestoneCount(), 3, "Should have 3 milestones");

        // Step 4: Invest with ETH
        vm.prank(investor1);
        project.invest{value: 6 ether}();

        // Additional investment to reach funding goal
        vm.prank(investor2);
        project.invest{value: 5 ether}();

        // Step 5: Move time forward to end funding period
        vm.warp(block.timestamp + 31 days);

        // Step 6: Update project state
        project.checkAndUpdateState();

        // Verify project state
        assertEq(uint8(project.getProjectState()), 1, "Project should be Successful");

        // Step 7: Submit milestone completion
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        // Step 8: Vote on milestone
        vm.prank(investor1);
        project.voteMilestone(0);

        // Step 9: Record balances before milestone fund release
        uint256 creatorBalanceBefore = creator.balance;
        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;

        // Step 10: Release funds for milestone
        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts
        uint256 totalFunding = 11 ether; // 6 ETH + 5 ETH
        uint256 milestoneAmount = (totalFunding * 3000) / 10000; // 30% of funds
        uint256 platformFee = (milestoneAmount * 500) / 10000; // 5% fee
        uint256 founderShare = (platformFee * FEE_DISTRIBUTION_PERCENTAGE) / 10000; // 30% of platform fee
        uint256 treasuryAmount = platformFee - founderShare;
        uint256 creatorAmount = milestoneAmount - platformFee;

        // Verify balances
        assertEq(creator.balance, creatorBalanceBefore + creatorAmount, "Creator should receive correct amount");
        assertEq(treasury.balance, treasuryBalanceBefore + treasuryAmount, "Treasury should receive correct fee amount");
        assertEq(
            address(founderNFT).balance,
            founderNFTBalanceBefore + founderShare,
            "FounderNFT contract should receive fee share"
        );

        // Verify the specific fund trackers in FounderNFT
        assertEq(founderNFT.getTotalSalesProceeds(), NFT_PRICE, "Sales proceeds should still match mint price");
        assertEq(
            founderNFT.getTotalUndistributedFees(), founderShare, "Undistributed fees should match platform fee share"
        );

        // Step 11: Fast forward minimum staking period to allow unstaking
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Step 12: Founder claims rewards
        uint256 founder1BalanceBefore = founder1.balance;

        vm.prank(founder1);
        founderNFT.claimStakingRewards(0);

        // Verify founder received rewards
        assertEq(founder1.balance, founder1BalanceBefore + founderShare, "Founder should receive fee share");

        // Verify undistributed fees are now 0 after claiming
        assertEq(founderNFT.getTotalUndistributedFees(), 0, "Undistributed fees should be 0 after claiming");

        // Sales proceeds should be unchanged by the claim process
        assertEq(
            founderNFT.getTotalSalesProceeds(), NFT_PRICE, "Sales proceeds should be unchanged after reward claiming"
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

    function testFounderBatchMint() public {
        // Create list of recipients
        address[] memory recipients = new address[](3);
        recipients[0] = founder1;
        recipients[1] = founder2;
        recipients[2] = investor1; // Using investor1 as a third founder for testing

        // Batch mint NFTs
        founderNFT.batchMint(recipients);

        // Verify ownership
        assertEq(founderNFT.ownerOf(0), founder1, "Founder1 should own NFT #0");
        assertEq(founderNFT.ownerOf(1), founder2, "Founder2 should own NFT #1");
        assertEq(founderNFT.ownerOf(2), investor1, "Investor1 should own NFT #2");

        // Verify total supply
        assertEq(founderNFT.totalSupply(), 3, "Total supply should be 3");
    }

    function testProjectUpgradesWithFounderNFT() public {
        // Create a founder and project
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.startPrank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            "Upgradeable Project",
            "A project that tests upgrades with FounderNFT",
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
    }
}
