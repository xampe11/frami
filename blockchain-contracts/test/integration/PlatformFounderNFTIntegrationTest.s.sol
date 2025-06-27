// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {FounderNFT} from "../../src/FounderNFT.sol";

contract PlatformFounderNFTIntegrationTest is Test {
    // Proxies
    ERC1967Proxy public registryProxy;
    ERC1967Proxy public founderNFTProxy;

    // Implementation contracts (wrapped proxies)
    PlatformRegistry public registry;
    FounderNFT public founderNFT;

    // Implementation addresses
    address public registryImpl;
    address public founderNFTImpl;

    // Dynamic extension keys
    bytes32 public constant FOUNDER_NFT_KEY = keccak256("FOUNDER_NFT");
    bytes32 public constant PROJECT_FACTORY_KEY = keccak256("PROJECT_FACTORY");
    bytes32 public constant ORACLE_KEY = keccak256("ORACLE");
    bytes32 public constant VALIDATOR_KEY = keccak256("VALIDATOR");
    bytes32 public constant NFT_FACTORY_KEY = keccak256("NFT_FACTORY");
    bytes32 public constant TOKEN_FACTORY_KEY = keccak256("TOKEN_FACTORY");
    bytes32 public constant GOVERNANCE_KEY = keccak256("GOVERNANCE");
    bytes32 public constant TREASURY_KEY = keccak256("TREASURY");

    // Extension categories
    bytes32 public constant CATEGORY_FACTORY = keccak256("FACTORY");
    bytes32 public constant CATEGORY_ORACLE = keccak256("ORACLE");
    bytes32 public constant CATEGORY_GOVERNANCE = keccak256("GOVERNANCE");
    bytes32 public constant CATEGORY_TREASURY = keccak256("TREASURY");
    bytes32 public constant CATEGORY_VALIDATOR = keccak256("VALIDATOR");
    bytes32 public constant CATEGORY_TOKEN = keccak256("TOKEN");
    bytes32 public constant CATEGORY_NFT = keccak256("NFT");
    bytes32 public constant CATEGORY_UTILITY = keccak256("UTILITY");

    // Constants for FounderNFT
    uint256 constant MAX_SUPPLY = 100;
    uint256 constant NFT_PRICE = 0.1 ether;
    uint256 constant FEE_DISTRIBUTION_PERCENTAGE = 5000; // 50%
    uint256 constant DAO_TOKEN_ALLOCATION = 1000; // 10%
    uint256 constant MIN_STAKING_PERIOD = 7 days;

    // Test accounts
    address public owner;
    address public treasury;
    address public founder1;
    address public founder2;
    address public founder3;
    address public mockProject;
    address public admin;

    function setUp() public {
        // Setup accounts
        owner = address(this);
        treasury = makeAddr("treasury");
        founder1 = makeAddr("founder1");
        founder2 = makeAddr("founder2");
        founder3 = makeAddr("founder3");
        mockProject = makeAddr("mockProject");
        admin = makeAddr("admin");

        // Fund accounts
        vm.deal(founder1, 10 ether);
        vm.deal(founder2, 10 ether);
        vm.deal(founder3, 10 ether);
        vm.deal(mockProject, 50 ether);
        vm.deal(admin, 5 ether);

        // Set consistent starting time
        vm.warp(1);

        // Deploy implementations
        PlatformRegistry registryImplementation = new PlatformRegistry();
        registryImpl = address(registryImplementation);

        FounderNFT founderNFTImplementation = new FounderNFT();
        founderNFTImpl = address(founderNFTImplementation);

        // Deploy PlatformRegistry proxy with dynamic system
        bytes memory registryData = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500, // 5% platform fee
            treasury
        );

        registryProxy = new ERC1967Proxy(registryImpl, registryData);
        registry = PlatformRegistry(payable(address(registryProxy)));

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

        // Register FounderNFT using dynamic extension system with all required parameters
        bytes32[] memory permissions = new bytes32[](0);
        vm.prank(owner);
        registry.registerExtension(
            FOUNDER_NFT_KEY,
            address(founderNFTProxy),
            CATEGORY_NFT,
            "Founder NFT",
            "1.0.0",
            "NFT for platform founders with staking rewards",
            permissions
        );

        // Enable sale for FounderNFT
        founderNFT.setSaleStatus(true);

        // Grant platform role to registry
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registryProxy));

        // Verify initial setup
        PlatformRegistry.FeeDistribution memory feeDistribution = registry.getFeeDistribution();
        assertEq(feeDistribution.founderNFTPercentage, 5000, "Initial founder percentage should be 50%");
        assertEq(feeDistribution.treasuryPercentage, 5000, "Initial treasury percentage should be 50%");
    }

    // ============================================================================
    // PLATFORM REGISTRY TESTS
    // ============================================================================

    function testPlatformRegistryInitialization() public view {
        // Test basic initialization
        assertEq(registry.getPlatformFeePercentage(), 500, "Platform fee should be 5%");
        assertEq(registry.getPlatformTreasury(), treasury, "Treasury address should match");
        assertEq(registry.getVersion(), "2.0.0", "Version should be 2.0.0");

        // Test fee distribution
        PlatformRegistry.FeeDistribution memory feeDistribution = registry.getFeeDistribution();
        assertEq(feeDistribution.founderNFTPercentage, 5000, "Founder percentage should be 50%");
        assertEq(feeDistribution.treasuryPercentage, 5000, "Treasury percentage should be 50%");
    }

    function testDynamicExtensionManagement() public {
        // Test extension registration
        address mockOracle = makeAddr("mockOracle");
        bytes32[] memory permissions = new bytes32[](0);

        vm.prank(owner);
        registry.registerExtension(
            ORACLE_KEY,
            mockOracle,
            CATEGORY_ORACLE,
            "Price Oracle",
            "1.0.0",
            "Price oracle for project valuations",
            permissions
        );

        assertTrue(registry.isExtensionRegistered(ORACLE_KEY), "Oracle should be registered");
        assertEq(registry.getExtension(ORACLE_KEY), mockOracle, "Oracle address should match");

        // Test removing extension
        vm.prank(owner);
        registry.removeExtension(ORACLE_KEY);

        assertFalse(registry.isExtensionRegistered(ORACLE_KEY), "Oracle should be removed");
        assertEq(registry.getExtension(ORACLE_KEY), address(0), "Oracle address should be zero");
    }

    function testFeeManagement() public {
        // Test platform fee update
        vm.prank(owner);
        registry.updatePlatformFee(750); // 7.5%

        assertEq(registry.getPlatformFeePercentage(), 750, "Platform fee should be updated");

        // Test treasury update
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        registry.updatePlatformTreasury(newTreasury);

        assertEq(registry.getPlatformTreasury(), newTreasury, "Treasury should be updated");

        // Test fee distribution update
        vm.prank(owner);
        registry.updateFeeDistribution(6000, 4000); // 60% founder, 40% treasury

        PlatformRegistry.FeeDistribution memory feeDistribution = registry.getFeeDistribution();
        assertEq(feeDistribution.founderNFTPercentage, 6000, "Founder percentage should be 60%");
        assertEq(feeDistribution.treasuryPercentage, 4000, "Treasury percentage should be 40%");
    }

    function testProjectManagement() public {
        // Note: Projects are typically registered by factories, but for testing we'll do it directly
        // In a real scenario, you'd need to register a factory first
        address mockFactory = makeAddr("mockFactory");
        
        // Register a factory first
        bytes32[] memory permissions = new bytes32[](0);
        vm.prank(owner);
        registry.registerExtension(
            PROJECT_FACTORY_KEY,
            mockFactory,
            CATEGORY_FACTORY,
            "Project Factory",
            "1.0.0",
            "Factory for creating projects",
            permissions
        );

        // Now register project through the factory
        vm.prank(mockFactory);
        registry.registerProject(mockProject);

        assertTrue(registry.isProjectRegistered(mockProject), "Mock project should be registered");

        // Test project deregistration
        vm.prank(owner);
        registry.deregisterProject(mockProject);

        assertFalse(registry.isProjectRegistered(mockProject), "Mock project should be deregistered");

        // Re-register for other tests
        vm.prank(mockFactory);
        registry.registerProject(mockProject);
    }

    // Note: Emergency controls functions like toggleEmergencyFreeze are not visible in the current PlatformRegistry
    // They might be in a different version or need to be added

    // ============================================================================
    // FOUNDER NFT TESTS
    // ============================================================================

    function testFounderNFTInitialization() public view {
        // Test basic NFT properties
        assertEq(founderNFT.name(), "Frami Founder", "NFT name should be Frami Founder");
        assertEq(founderNFT.symbol(), "FRAMI", "NFT symbol should be FRAMI");
        assertEq(founderNFT.getMaxSupply(), MAX_SUPPLY, "Max supply should match");
        assertEq(founderNFT.getPrice(), NFT_PRICE, "NFT price should match");

        // Test platform integration
        assertEq(founderNFT.getPlatformRegistry(), address(registry), "Registry address should match");
        assertEq(
            founderNFT.getPlatformFeeDistributionPercentage(), FEE_DISTRIBUTION_PERCENTAGE, "Fee percentage should match"
        );
    }

    function testFounderNFTMinting() public {
        uint256 initialSupply = founderNFT.totalSupply();

        // Test minting
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        assertEq(founderNFT.totalSupply(), initialSupply + 1, "Total supply should increase");
        assertEq(founderNFT.ownerOf(0), founder1, "Founder1 should own token 0");
        assertEq(founderNFT.balanceOf(founder1), 1, "Founder1 should have 1 token");

        // Test multiple minting
        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder3);
        founderNFT.mint{value: NFT_PRICE}();

        assertEq(founderNFT.totalSupply(), initialSupply + 3, "Total supply should be 3");
    }

    function testFounderNFTStaking() public {
        // Mint NFTs first
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder2);
        founderNFT.mint{value: NFT_PRICE}();

        // Test staking
        vm.prank(founder1);
        founderNFT.stakeToken(0);

        assertTrue(founderNFT.isTokenStaked(0), "Token 0 should be staked");
        assertEq(founderNFT.getTotalStakedSupply(), 1, "Total staked should be 1");

        // Test multiple staking
        vm.prank(founder2);
        founderNFT.stakeToken(1);

        assertEq(founderNFT.getTotalStakedSupply(), 2, "Total staked should be 2");

        // Test unstaking
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        vm.prank(founder1);
        founderNFT.unstakeToken(0);

        assertFalse(founderNFT.isTokenStaked(0), "Token 0 should be unstaked");
        assertEq(founderNFT.getTotalStakedSupply(), 1, "Total staked should be 1");
    }

    function testFounderNFTRewards() public {
        // Mint and stake NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Add platform fees using the registry (which has PLATFORM_ROLE)
        uint256 feeAmount = 1 ether;
        vm.deal(address(registry), feeAmount);
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: feeAmount}(0);

        // Fast forward time to accrue rewards
        vm.warp(block.timestamp + 1 hours);

        // Check earned rewards
        uint256 earned = founderNFT.earned(0);
        assertGt(earned, 0, "Should have earned rewards");

        // Claim rewards
        uint256 founder1BalanceBefore = founder1.balance;

        vm.prank(founder1);
        founderNFT.claimReward(0);

        uint256 rewardsReceived = founder1.balance - founder1BalanceBefore;
        assertGt(rewardsReceived, 0, "Should have received rewards");
        assertEq(founderNFT.earned(0), 0, "Earned should be reset to 0");
    }

    // ============================================================================
    // INTEGRATION TESTS
    // ============================================================================

    function testPlatformRegistryFounderNFTIntegration() public view {
        // Verify FounderNFT is properly registered
        assertTrue(registry.isExtensionRegistered(FOUNDER_NFT_KEY), "FounderNFT should be registered");
        assertEq(registry.getExtension(FOUNDER_NFT_KEY), address(founderNFT), "Address should match");

        // Test convenience getter
        assertEq(registry.getFounderNFT(), address(founderNFT), "Convenience getter should work");
    }

    // Note: Some integration tests that rely on functions like distributePlatformFees 
    // would need those functions to be implemented in the PlatformRegistry
    
    function testVersioningAndMetadata() public view {
        // Test platform registry versioning
        assertEq(registry.getVersion(), "2.0.0", "Registry version should be 2.0.0");

        // Test FounderNFT metadata
        assertEq(founderNFT.name(), "Frami Founder", "NFT name should be correct");
        assertEq(founderNFT.symbol(), "FRAMI", "NFT symbol should be correct");
    }

    // ============================================================================
    // ACCESS CONTROL TESTS
    // ============================================================================

    function testAccessControlRegistry() public {
        // Test that non-admin cannot register extensions
        bytes32[] memory permissions = new bytes32[](0);
        vm.prank(founder1);
        vm.expectRevert();
        registry.registerExtension(
            keccak256("UNAUTHORIZED"), 
            makeAddr("unauthorized"),
            CATEGORY_UTILITY,
            "Unauthorized",
            "1.0.0",
            "Should fail",
            permissions
        );

        // Test that non-admin cannot update fees
        vm.prank(founder1);
        vm.expectRevert();
        registry.updatePlatformFee(1000);
    }

    function testAccessControlFounderNFT() public {
        // Test that non-admin cannot set sale status
        vm.prank(founder1);
        vm.expectRevert();
        founderNFT.setSaleStatus(false);

        // Test that non-platform cannot add fees
        vm.prank(founder1);
        vm.expectRevert();
        founderNFT.addPlatformFees{value: 1 ether}(1 ether);
    }

    // ============================================================================
    // BATCH OPERATIONS TESTS
    // ============================================================================

    function testBatchStaking() public {
        // Mint multiple NFTs
        vm.prank(founder1);
        founderNFT.mintMultiple{value: NFT_PRICE * 3}(3);

        // Batch stake
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(founder1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Verify all tokens are staked
        for (uint256 i = 0; i < 3; i++) {
            assertTrue(founderNFT.isTokenStaked(i), "Token should be staked");
        }
        assertEq(founderNFT.getTotalStakedSupply(), 3, "Total staked should be 3");
    }

    function testBatchUnstaking() public {
        // First, do batch staking
        testBatchStaking();

        // Wait for minimum staking period
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        // Batch unstake
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        vm.prank(founder1);
        founderNFT.unstakeMultipleTokens(tokenIds);

        // Verify all tokens are unstaked
        for (uint256 i = 0; i < 3; i++) {
            assertFalse(founderNFT.isTokenStaked(i), "Token should be unstaked");
        }
        assertEq(founderNFT.getTotalStakedSupply(), 0, "Total staked should be 0");
    }

    function testBatchRewardClaiming() public {
        // Setup: mint, stake, and add rewards
        vm.prank(founder1);
        founderNFT.mintMultiple{value: NFT_PRICE * 2}(2);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 0;
        tokenIds[1] = 1;

        vm.prank(founder1);
        founderNFT.stakeMultipleTokens(tokenIds);

        // Add rewards using the registry (which has PLATFORM_ROLE)
        uint256 feeAmount = 2 ether;
        vm.deal(address(registry), feeAmount);
        vm.prank(address(registry));
        founderNFT.addPlatformFees{value: feeAmount}(0);

        // Fast forward time
        vm.warp(block.timestamp + 1 hours);

        // Claim multiple rewards
        uint256 balanceBefore = founder1.balance;
        
        vm.prank(founder1);
        founderNFT.claimMultipleRewards(tokenIds);

        uint256 rewardsReceived = founder1.balance - balanceBefore;
        assertGt(rewardsReceived, 0, "Should have received batch rewards");
    }
}