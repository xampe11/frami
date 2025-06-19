// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {ProjectFactory} from "../../src/ProjectFactory.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";
import {ExtensionKeys} from "../../src/ExtensionKeys.sol";

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
    uint256 constant FEE_DISTRIBUTION_PERCENTAGE = 5000; // 50%
    uint256 constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 constant MIN_STAKING_PERIOD = 7 days;
    uint256 constant SALES_REDISTRIBUTION_PERCENTAGE = 1000; // 10%

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

        // Register ProjectFactory using standardized extension key
        vm.prank(owner);
        registry.registerExtension(ExtensionKeys.PROJECT_FACTORY, address(factoryProxy));

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

        // Register FounderNFT using standardized extension key
        vm.prank(owner);
        registry.registerExtension(ExtensionKeys.FOUNDER_NFT, address(founderNFTProxy));

        // Enable sale for FounderNFT
        founderNFT.setSaleStatus(true);

        // Grant platform role to registry
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registryProxy));

        // Set up roles
        vm.prank(owner);
        registry.grantProjectCreatorRole(creator);

        vm.prank(owner);
        factory.grantRole(factory.ADMIN_ROLE(), address(registryProxy));

        // Verify initial setup using ExtensionKeys
        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 5000, "Initial founder percentage should be 50%");
        assertEq(treasuryPct, 5000, "Initial treasury percentage should be 50%");
    }

    function testExtensionKeysIntegration() public {
        // Test that all extension keys are properly set
        assertEq(
            registry.getExtension(ExtensionKeys.PROJECT_FACTORY),
            address(factoryProxy),
            "ProjectFactory should be registered with correct key"
        );

        assertEq(
            registry.getExtension(ExtensionKeys.FOUNDER_NFT),
            address(founderNFTProxy),
            "FounderNFT should be registered with correct key"
        );

        // Test extension validation
        assertTrue(
            registry.isExtensionRegistered(ExtensionKeys.PROJECT_FACTORY),
            "ProjectFactory should be registered"
        );

        assertTrue(
            registry.isExtensionRegistered(ExtensionKeys.FOUNDER_NFT),
            "FounderNFT should be registered"
        );

        // Test that unregistered extensions return false
        assertFalse(
            registry.isExtensionRegistered(ExtensionKeys.ORACLE),
            "Oracle should not be registered"
        );

        // Test getAllExtensions function
        (bytes32[] memory keys, address[] memory addresses) = registry.getAllExtensions();
        assertTrue(keys.length > 0, "Should return extension keys");
        assertTrue(addresses.length > 0, "Should return extension addresses");
        assertEq(keys.length, addresses.length, "Keys and addresses arrays should be same length");
    }

    function testEnhancedFeeDistributionIntegration() public {
        // Step 1: Mint and stake FounderNFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Step 2: Create a project
        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator,
            "Test Project", 
            "A test project for enhanced fee distribution testing",
            10 ether,
            30 days,
            false,
            teamMembers
        );

        project = Project(payable(projectAddress));

        // Step 3: Create milestones
        vm.startPrank(creator);
        project.createMilestone("Initial Development", 3000); // 30% of funds
        project.createMilestone("MVP Release", 4000); // 40% of funds  
        project.createMilestone("Final Product", 3000); // 30% of funds
        vm.stopPrank();

        // Step 4: Fund the project
        vm.prank(investor1);
        project.invest{value: 6 ether}();

        vm.prank(investor2);
        project.invest{value: 5 ether}();

        // Step 5: Complete funding period and update state
        vm.warp(block.timestamp + 31 days);
        project.checkAndUpdateState();

        // Step 6: Complete first milestone
        vm.prank(creator);
        project.submitMilestoneCompletion(0);

        vm.prank(investor1);
        project.voteMilestone(0);

        // Check earned rewards before release
        uint256 earnedBefore = founderNFT.earned(0);

        // Step 7: Release milestone funds with enhanced fee distribution
        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;

        vm.prank(creator);
        project.releaseMilestoneFunds(0);

        // Calculate expected amounts based on enhanced fee distribution (50-50 split)
        uint256 totalFunding = 11 ether;
        uint256 milestoneAmount = (totalFunding * 3000) / 10000; // 30% of funds = 3.3 ETH
        uint256 platformFee = (milestoneAmount * 500) / 10000; // 5% fee = 0.165 ETH
        uint256 founderShare = (platformFee * 5000) / 10000; // 50% of platform fee = 0.0825 ETH
        uint256 treasuryShare = platformFee - founderShare; // Remaining 50% = 0.0825 ETH

        console.log("Platform fee:", platformFee);
        console.log("Founder share (50%):", founderShare);
        console.log("Treasury share (50%):", treasuryShare);

        // Verify fee distribution is working correctly
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
            // Step 8: Founder claims rewards
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

    function testEmergencyFeeControls() public {
        // Create and fund a project
        vm.prank(creator);
        address[] memory teamMembers = new address[](0);
        projectAddress = registry.createProject(
            creator,
            "Emergency Test Project",
            "Testing emergency fee controls",
            5 ether,
            30 days,
            false,
            teamMembers
        );

        project = Project(payable(projectAddress));

        vm.prank(creator);
        project.createMilestone("Emergency Test", 10000); // 100% of funds

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

    function testExtensionManagement() public {
        // Test registering a new extension
        address mockOracle = makeAddr("mockOracle");
        
        vm.prank(owner);
        registry.registerExtension(ExtensionKeys.ORACLE, mockOracle);

        assertTrue(
            registry.isExtensionRegistered(ExtensionKeys.ORACLE),
            "Oracle should be registered"
        );

        assertEq(
            registry.getExtension(ExtensionKeys.ORACLE),
            mockOracle,
            "Oracle address should match"
        );

        // Test removing an extension
        vm.prank(owner);
        registry.removeExtension(ExtensionKeys.ORACLE);

        assertFalse(
            registry.isExtensionRegistered(ExtensionKeys.ORACLE),
            "Oracle should be removed"
        );

        assertEq(
            registry.getExtension(ExtensionKeys.ORACLE),
            address(0),
            "Oracle address should be zero"
        );
    }

    function testExtensionKeyValidation() public {
        // Test that invalid extension keys are rejected
        bytes32 invalidKey = keccak256("INVALID_EXTENSION");
        address mockContract = makeAddr("mockContract");

        vm.prank(owner);
        vm.expectRevert("Invalid extension key");
        registry.registerExtension(invalidKey, mockContract);
    }

    function testProjectFactoryValidation() public {
        // Test that isFactoryRegistered works correctly
        assertTrue(
            registry.isFactoryRegistered(address(factoryProxy)),
            "ProjectFactory should be recognized as registered factory"
        );

        // Test with unregistered factory
        address fakeFactory = makeAddr("fakeFactory");
        assertFalse(
            registry.isFactoryRegistered(fakeFactory),
            "Fake factory should not be recognized"
        );

        // Test project initialization with unregistered factory
        Project projectImplementation = new Project();
        
        bytes memory initData = abi.encodeWithSelector(
            Project.initialize.selector,
            creator,
            "Test Project",
            "Description",
            1 ether,
            30 days,
            false,
            500,
            treasury,
            address(registry),
            new address[](0)
        );

        // This should fail because fakeFactory is not registered
        vm.prank(fakeFactory);
        vm.expectRevert("Only registered factories can initialize projects");
        new ERC1967Proxy(address(projectImplementation), initData);
    }

    function testExtensionKeysLibraryFunctions() public {
        // Test getAllKeys function
        bytes32[] memory allKeys = ExtensionKeys.getAllKeys();
        assertEq(allKeys.length, 8, "Should return 8 extension keys");
        
        // Verify specific keys are included
        bool foundFounderNFT = false;
        bool foundProjectFactory = false;
        
        for (uint256 i = 0; i < allKeys.length; i++) {
            if (allKeys[i] == ExtensionKeys.FOUNDER_NFT) {
                foundFounderNFT = true;
            }
            if (allKeys[i] == ExtensionKeys.PROJECT_FACTORY) {
                foundProjectFactory = true;
            }
        }
        
        assertTrue(foundFounderNFT, "FOUNDER_NFT key should be in getAllKeys result");
        assertTrue(foundProjectFactory, "PROJECT_FACTORY key should be in getAllKeys result");

        // Test getExtensionName function
        assertEq(
            ExtensionKeys.getExtensionName(ExtensionKeys.FOUNDER_NFT),
            "FounderNFT",
            "Should return correct name for FOUNDER_NFT"
        );

        assertEq(
            ExtensionKeys.getExtensionName(ExtensionKeys.PROJECT_FACTORY),
            "ProjectFactory",
            "Should return correct name for PROJECT_FACTORY"
        );

        // Test isValidExtensionKey function
        assertTrue(
            ExtensionKeys.isValidExtensionKey(ExtensionKeys.FOUNDER_NFT),
            "FOUNDER_NFT should be valid"
        );

        assertFalse(
            ExtensionKeys.isValidExtensionKey(keccak256("INVALID_KEY")),
            "Invalid key should return false"
        );
    }

    function testBackwardCompatibility() public {
        // Test that deprecated constants still work
        assertEq(
            registry.NFT_FACTORY_EXTENSION(),
            ExtensionKeys.NFT_FACTORY,
            "Deprecated NFT_FACTORY_EXTENSION should equal new constant"
        );

        assertEq(
            registry.FOUNDER_NFT_EXTENSION(),
            ExtensionKeys.FOUNDER_NFT,
            "Deprecated FOUNDER_NFT_EXTENSION should equal new constant"
        );
    }
}