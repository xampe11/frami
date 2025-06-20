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

        // Register FounderNFT using dynamic extension system
        vm.prank(owner);
        registry.registerExtension(FOUNDER_NFT_KEY, address(founderNFTProxy));

        // Enable sale for FounderNFT
        founderNFT.setSaleStatus(true);

        // Grant platform role to registry
        founderNFT.grantRole(founderNFT.PLATFORM_ROLE(), address(registryProxy));

        // Register mock project for testing
        vm.prank(owner);
        registry.registerProject(mockProject);

        // Verify initial setup
        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 5000, "Initial founder percentage should be 50%");
        assertEq(treasuryPct, 5000, "Initial treasury percentage should be 50%");
    }

    // ============================================================================
    // PLATFORM REGISTRY TESTS
    // ============================================================================

    function testPlatformRegistryInitialization() public view {
        // Test basic initialization
        assertEq(registry.platformFeePercentage(), 500, "Platform fee should be 5%");
        assertEq(registry.platformTreasury(), treasury, "Treasury address should match");
        assertEq(registry.version(), "2.0.0", "Version should be 2.0.0");

        // Test fee distribution
        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 5000, "Founder percentage should be 50%");
        assertEq(treasuryPct, 5000, "Treasury percentage should be 50%");
    }

    function testDynamicExtensionManagement() public {
        // Test extension registration
        address mockOracle = makeAddr("mockOracle");

        vm.prank(owner);
        registry.registerExtension(ORACLE_KEY, mockOracle);

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

        assertEq(registry.platformFeePercentage(), 750, "Platform fee should be updated");

        // Test treasury update
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        registry.updatePlatformTreasury(newTreasury);

        assertEq(registry.platformTreasury(), newTreasury, "Treasury should be updated");

        // Test fee distribution update
        vm.prank(owner);
        registry.updateFeeDistribution(6000, 4000); // 60% founder, 40% treasury

        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 6000, "Founder percentage should be 60%");
        assertEq(treasuryPct, 4000, "Treasury percentage should be 40%");
    }

    function testProjectManagement() public {
        // Test project registration (already done in setUp)
        assertTrue(registry.isProjectRegistered(mockProject), "Mock project should be registered");

        // Test project deregistration
        vm.prank(owner);
        registry.deregisterProject(mockProject);

        assertFalse(registry.isProjectRegistered(mockProject), "Mock project should be deregistered");

        // Re-register for other tests
        vm.prank(owner);
        registry.registerProject(mockProject);
    }

    function testEmergencyControls() public {
        address emergencyRecipient = makeAddr("emergency");

        // Test emergency freeze
        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        (bool frozen, address recipient) = registry.getEmergencyStatus();
        assertTrue(frozen, "Platform should be frozen");
        assertEq(recipient, emergencyRecipient, "Emergency recipient should be set");

        // Test unfreeze
        vm.prank(owner);
        registry.toggleEmergencyFreeze(false, address(0));

        (bool frozenAfter,) = registry.getEmergencyStatus();
        assertFalse(frozenAfter, "Platform should be unfrozen");
    }

    // ============================================================================
    // FOUNDER NFT TESTS
    // ============================================================================

    function testFounderNFTInitialization() public view {
        // Test basic NFT properties
        assertEq(founderNFT.name(), "FounderNFT", "NFT name should be FounderNFT");
        assertEq(founderNFT.symbol(), "FNFT", "NFT symbol should be FNFT");
        assertEq(founderNFT.maxSupply(), MAX_SUPPLY, "Max supply should match");
        assertEq(founderNFT.price(), NFT_PRICE, "NFT price should match");

        // Test platform integration
        assertEq(founderNFT.platformRegistry(), address(registry), "Registry address should match");
        assertEq(
            founderNFT.platformFeeDistributionPercentage(), FEE_DISTRIBUTION_PERCENTAGE, "Fee percentage should match"
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
        assertEq(founderNFT.getTotalStakedTokens(), 1, "Total staked should be 1");

        // Test multiple staking
        vm.prank(founder2);
        founderNFT.stakeToken(1);

        assertEq(founderNFT.getTotalStakedTokens(), 2, "Total staked should be 2");

        // Test unstaking
        vm.warp(block.timestamp + MIN_STAKING_PERIOD + 1);

        vm.prank(founder1);
        founderNFT.unstakeToken(0);

        assertFalse(founderNFT.isTokenStaked(0), "Token 0 should be unstaked");
        assertEq(founderNFT.getTotalStakedTokens(), 1, "Total staked should be 1");
    }

    function testFounderNFTRewards() public {
        // Mint and stake NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Add platform fees
        uint256 feeAmount = 1 ether;
        vm.deal(address(founderNFT), feeAmount);

        founderNFT.addPlatformFees(feeAmount);

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

    function testPlatformRegistryFounderNFTIntegration() public {
        // Verify FounderNFT is properly registered
        assertTrue(registry.isExtensionRegistered(FOUNDER_NFT_KEY), "FounderNFT should be registered");
        assertEq(registry.getExtension(FOUNDER_NFT_KEY), address(founderNFT), "Address should match");

        // Test convenience getter
        assertEq(registry.getFounderNFT(), address(founderNFT), "Convenience getter should work");
    }

    function testFeeDistributionIntegration() public {
        // Mint and stake FounderNFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Test fee distribution from registry to FounderNFT
        uint256 totalFee = 2 ether;
        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;

        // Simulate fee distribution
        vm.prank(mockProject);
        registry.distributePlatformFees{value: totalFee}(totalFee);

        // Calculate expected distribution (50-50 split)
        uint256 founderShare = (totalFee * 5000) / 10000; // 50%
        uint256 treasuryShare = totalFee - founderShare;

        // Verify distribution
        assertEq(treasury.balance, treasuryBalanceBefore + treasuryShare, "Treasury should receive 50%");
        assertGt(address(founderNFT).balance, founderNFTBalanceBefore, "FounderNFT should receive founder portion");

        // Verify fee tracking
        assertEq(registry.getTotalFeesReceived(treasury), treasuryShare, "Treasury fee tracking should match");
        assertGt(registry.getTotalFeesReceived(address(founderNFT)), 0, "FounderNFT fee tracking should be > 0");
    }

    function testRelayFounderFees() public {
        // Mint and stake FounderNFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Test relay fees from project to FounderNFT
        uint256 feeAmount = 1 ether;
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;

        vm.prank(mockProject);
        registry.relayFounderFees{value: feeAmount}(feeAmount);

        assertEq(
            address(founderNFT).balance, founderNFTBalanceBefore + feeAmount, "FounderNFT should receive relayed fees"
        );

        // Verify fee tracking
        assertEq(registry.getTotalFeesReceived(address(founderNFT)), feeAmount, "Relayed fee tracking should match");
    }

    function testPendingFeesManagement() public {
        // Test pending fees accumulation when no stakers
        uint256 totalFee = 1 ether;

        // Distribute fees with no stakers
        vm.prank(mockProject);
        registry.distributePlatformFees{value: totalFee}(totalFee);

        uint256 pendingFees = registry.getPendingFounderFees();
        assertGt(pendingFees, 0, "Should have pending fees when no stakers");

        // Mint and stake NFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Distribute pending fees
        uint256 founderNFTBalanceBefore = address(founderNFT).balance;

        vm.prank(owner);
        registry.distributePendingFounderFees();

        assertGt(address(founderNFT).balance, founderNFTBalanceBefore, "FounderNFT should receive pending fees");
        assertEq(registry.getPendingFounderFees(), 0, "Pending fees should be cleared");
    }

    function testEmergencyFeeFreezeIntegration() public {
        address emergencyRecipient = makeAddr("emergency");

        // Enable emergency freeze
        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        // Try to distribute fees during freeze
        vm.prank(mockProject);
        vm.expectRevert("Fee distribution frozen");
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        // Disable freeze and try again
        vm.prank(owner);
        registry.toggleEmergencyFreeze(false, address(0));

        // Should work now
        vm.prank(mockProject);
        registry.distributePlatformFees{value: 1 ether}(1 ether);
    }

    function testComprehensiveFeeStats() public {
        // Mint and stake FounderNFT
        vm.prank(founder1);
        founderNFT.mint{value: NFT_PRICE}();

        vm.prank(founder1);
        founderNFT.stakeToken(0);

        // Distribute some fees
        uint256 totalFee = 2 ether;
        vm.prank(mockProject);
        registry.distributePlatformFees{value: totalFee}(totalFee);

        // Get comprehensive fee stats
        (
            uint256 founderPercentage,
            uint256 treasuryPercentage,
            uint256 totalFounderFees,
            uint256 totalTreasuryFees,
            uint256 pendingFounderFees
        ) = registry.getFeeStats();

        assertEq(founderPercentage, 5000, "Founder percentage should be 50%");
        assertEq(treasuryPercentage, 5000, "Treasury percentage should be 50%");
        assertGt(totalFounderFees, 0, "Should have founder fees");
        assertGt(totalTreasuryFees, 0, "Should have treasury fees");
        assertEq(pendingFounderFees, 0, "Should have no pending fees with stakers");
    }

    function testVersioningAndMetadata() public view {
        // Test platform registry versioning
        assertEq(registry.version(), "2.0.0", "Registry version should be 2.0.0");

        // Test FounderNFT metadata
        assertEq(founderNFT.name(), "FounderNFT", "NFT name should be correct");
        assertEq(founderNFT.symbol(), "FNFT", "NFT symbol should be correct");
    }

    // ============================================================================
    // ACCESS CONTROL TESTS
    // ============================================================================

    function testAccessControlRegistry() public {
        // Test that non-admin cannot register extensions
        vm.prank(founder1);
        vm.expectRevert();
        registry.registerExtension(keccak256("UNAUTHORIZED"), makeAddr("unauthorized"));

        // Test that non-admin cannot update fees
        vm.prank(founder1);
        vm.expectRevert();
        registry.updatePlatformFee(1000);

        // Test that non-admin cannot manage emergency controls
        vm.prank(founder1);
        vm.expectRevert();
        registry.toggleEmergencyFreeze(true, makeAddr("emergency"));
    }

    function testAccessControlFounderNFT() public {
        // Test that non-admin cannot set sale status
        vm.prank(founder1);
        vm.expectRevert();
        founderNFT.setSaleStatus(false);

        // Test that non-platform cannot add fees
        vm.prank(founder1);
        vm.expectRevert();
        founderNFT.addPlatformFees(1 ether);
    }
}
