// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";

// Mock ProjectFactory for testing
contract MockProjectFactory {
    address[] public createdProjects;

    function createProject(
        address creator,
        string memory name,
        string memory, /* description */
        uint256, /* fundingGoal */
        uint256, /* duration */
        bool, /* isFlexibleFunding */
        uint256, /* platformFeePercentage */
        address, /* platformTreasury */
        address[] memory /* teamMembers */
    ) external returns (address) {
        // Create a mock project address (just use a deterministic address)
        address projectAddress = address(uint160(uint256(keccak256(abi.encodePacked(creator, name, block.timestamp)))));
        createdProjects.push(projectAddress);
        return projectAddress;
    }
}

contract MockFounderNFT {
    uint256 public totalStakedTokens;
    uint256 public platformFeeDistributionPercentage = 5000; // 50%
    bool public shouldFailAddFees;
    bool public shouldFailStakeCheck;

    receive() external payable {}

    function setTotalStakedTokens(uint256 _amount) external {
        totalStakedTokens = _amount;
    }

    function setShouldFailAddFees(bool _shouldFail) external {
        shouldFailAddFees = _shouldFail;
    }

    function setShouldFailStakeCheck(bool _shouldFail) external {
        shouldFailStakeCheck = _shouldFail;
    }

    function setPlatformFeeDistributionPercentage(uint256 _percentage) external {
        platformFeeDistributionPercentage = _percentage;
    }

    function getTotalStakedTokens() external view returns (uint256) {
        if (shouldFailStakeCheck) {
            revert("Stake check failed");
        }
        return totalStakedTokens;
    }

    function getPlatformFeeDistributionPercentage() external view returns (uint256) {
        return platformFeeDistributionPercentage;
    }

    function addPlatformFees(uint256 /* amount */ ) external view {
        if (shouldFailAddFees) {
            revert("Add fees failed");
        }
        // Just receive the fees
    }
}

contract RejectingContract {
    receive() external payable {
        revert("Rejecting ETH");
    }
}

contract PlatformRegistryTest is Test {
    PlatformRegistry public implementation;
    PlatformRegistry public registry;
    ERC1967Proxy public proxy;
    MockFounderNFT public mockFounderNFT;
    MockProjectFactory public mockFactory;

    address public owner;
    address public treasury;
    address public user1;
    address public user2;

    // Dynamic extension keys
    bytes32 public constant FOUNDER_NFT_KEY = keccak256("FOUNDER_NFT");
    bytes32 public constant PROJECT_FACTORY_KEY = keccak256("PROJECT_FACTORY");
    bytes32 public constant ORACLE_KEY = keccak256("ORACLE");
    bytes32 public constant VALIDATOR_KEY = keccak256("VALIDATOR");
    bytes32 public constant NFT_FACTORY_KEY = keccak256("NFT_FACTORY");
    bytes32 public constant TOKEN_FACTORY_KEY = keccak256("TOKEN_FACTORY");

    // Extension categories
    bytes32 public constant CATEGORY_FACTORY = keccak256("FACTORY");
    bytes32 public constant CATEGORY_ORACLE = keccak256("ORACLE");
    bytes32 public constant CATEGORY_GOVERNANCE = keccak256("GOVERNANCE");
    bytes32 public constant CATEGORY_TREASURY = keccak256("TREASURY");
    bytes32 public constant CATEGORY_VALIDATOR = keccak256("VALIDATOR");
    bytes32 public constant CATEGORY_TOKEN = keccak256("TOKEN");
    bytes32 public constant CATEGORY_NFT = keccak256("NFT");
    bytes32 public constant CATEGORY_UTILITY = keccak256("UTILITY");

    // Events to test
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event ExtensionRegistered(
        bytes32 indexed extensionKey,
        address indexed implementation,
        bytes32 indexed category,
        string name,
        string version
    );
    event ExtensionRemoved(bytes32 indexed extensionKey, address indexed implementation);

    function setUp() public {
        owner = address(this);
        treasury = makeAddr("treasury");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy mock contracts first
        mockFounderNFT = new MockFounderNFT();
        mockFactory = new MockProjectFactory();

        // Deploy implementation
        implementation = new PlatformRegistry();

        // Prepare initialization data for dynamic system (no factory parameter)
        bytes memory data = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500, // 5% platform fee
            treasury
        );

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        registry = PlatformRegistry(payable(address(proxy)));

        // Register ProjectFactory extension using dynamic system
        vm.prank(owner);
        registry.registerExtension(
            PROJECT_FACTORY_KEY,
            address(mockFactory),
            CATEGORY_FACTORY,
            "Mock Project Factory",
            "1.0.0",
            "Creates mock projects for testing",
            new bytes32[](0)
        );

        // Register FounderNFT extension using dynamic system
        vm.prank(owner);
        registry.registerExtension(
            FOUNDER_NFT_KEY,
            address(mockFounderNFT),
            CATEGORY_NFT,
            "Mock Founder NFT",
            "1.0.0",
            "Mock NFT for testing rewards",
            new bytes32[](0)
        );

        // Give contracts some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============================================================================
    // INITIALIZATION TESTS
    // ============================================================================

    function testInitialization() public view {
        assertEq(registry.getPlatformFeePercentage(), 500, "Wrong platform fee");
        assertEq(registry.getPlatformTreasury(), treasury, "Wrong treasury address");
        assertEq(registry.getVersion(), "2.0.0", "Wrong version");
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), owner), "Owner should have ADMIN_ROLE");
        assertTrue(registry.hasRole(registry.UPGRADER_ROLE(), owner), "Owner should have UPGRADER_ROLE");

        // Test fee distribution initialization
        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 5000, "Founder percentage should be 50%");
        assertEq(treasuryPct, 5000, "Treasury percentage should be 50%");
    }

    // ============================================================================
    // ADMIN FUNCTION TESTS
    // ============================================================================

    function testUpdatePlatformFee() public {
        uint256 newFee = 300; // 3%
        vm.prank(owner);
        registry.updatePlatformFee(newFee);
        assertEq(registry.getPlatformFeePercentage(), newFee, "Fee not updated");
    }

    function testUpdatePlatformFeeTooHigh() public {
        uint256 newFee = 1100; // 11% - should fail as max is 10%
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        registry.updatePlatformFee(newFee);
    }

    function testUpdatePlatformFeeUnauthorized() public {
        uint256 newFee = 300; // 3%
        vm.prank(user1);
        vm.expectRevert();
        registry.updatePlatformFee(newFee);
    }

    function testUpdateTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        registry.updatePlatformTreasury(newTreasury);
        assertEq(registry.getPlatformTreasury(), newTreasury, "Treasury not updated");
    }

    function testUpdateTreasuryInvalidAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid treasury address");
        registry.updatePlatformTreasury(address(0));
    }

    function testUpdateFeeDistribution() public {
        vm.prank(owner);
        registry.updateFeeDistribution(6000, 4000); // 60% founder, 40% treasury

        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 6000, "Founder percentage should be 60%");
        assertEq(treasuryPct, 4000, "Treasury percentage should be 40%");
    }

    function testUpdateFeeDistributionInvalidSum() public {
        vm.prank(owner);
        vm.expectRevert("Percentages must sum to 100%");
        registry.updateFeeDistribution(6000, 5000); // 110% total
    }

    function testPauseUnpause() public {
        assertFalse(registry.paused(), "Should not be paused initially");

        vm.prank(owner);
        registry.pause();
        assertTrue(registry.paused(), "Should be paused after pause");

        vm.prank(owner);
        registry.unpause();
        assertFalse(registry.paused(), "Should not be paused after unpause");
    }

    // ============================================================================
    // DYNAMIC EXTENSION MANAGEMENT TESTS
    // ============================================================================

    function testRegisterExtension() public {
        address mockOracle = makeAddr("mockOracle");
        bytes32[] memory permissions = new bytes32[](1);
        permissions[0] = keccak256("PRICE_FEED_ACCESS");

        vm.expectEmit(true, true, true, true);
        emit ExtensionRegistered(ORACLE_KEY, mockOracle, CATEGORY_ORACLE, "Mock Oracle", "1.0.0");

        vm.prank(owner);
        registry.registerExtension(
            ORACLE_KEY,
            mockOracle,
            CATEGORY_ORACLE,
            "Mock Oracle",
            "1.0.0",
            "Provides price data for testing",
            permissions
        );

        assertTrue(registry.isExtensionRegistered(ORACLE_KEY), "Oracle should be registered");
        assertEq(registry.getExtension(ORACLE_KEY), mockOracle, "Oracle address should match");
        assertTrue(registry.extensionExists(ORACLE_KEY), "Oracle should exist");

        // Test extension info
        PlatformRegistry.ExtensionInfo memory info = registry.getExtensionInfo(ORACLE_KEY);
        assertEq(info.implementation, mockOracle, "Implementation should match");
        assertEq(info.category, CATEGORY_ORACLE, "Category should match");
        assertEq(info.name, "Mock Oracle", "Name should match");
        assertEq(info.version, "1.0.0", "Version should match");
        assertTrue(info.isActive, "Should be active");
    }

    function testRegisterExtensionInvalidAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid implementation address");
        registry.registerExtension(
            ORACLE_KEY, address(0), CATEGORY_ORACLE, "Mock Oracle", "1.0.0", "Description", new bytes32[](0)
        );
    }

    function testRegisterExtensionAlreadyExists() public {
        // Try to register FounderNFT again (already registered in setUp)
        vm.prank(owner);
        vm.expectRevert("Extension already exists");
        registry.registerExtension(
            FOUNDER_NFT_KEY, makeAddr("duplicate"), CATEGORY_NFT, "Duplicate", "2.0.0", "Description", new bytes32[](0)
        );
    }

    function testUpgradeExtension() public {
        address mockValidatorV1 = makeAddr("mockValidatorV1");
        address mockValidatorV2 = makeAddr("mockValidatorV2");

        // Register initial version
        vm.prank(owner);
        registry.registerExtension(
            VALIDATOR_KEY,
            mockValidatorV1,
            CATEGORY_VALIDATOR,
            "Mock Validator",
            "1.0.0",
            "Validates project milestones",
            new bytes32[](0)
        );

        // Upgrade to V2
        vm.prank(owner);
        registry.upgradeExtension(VALIDATOR_KEY, mockValidatorV2, "2.0.0");

        assertEq(registry.getExtension(VALIDATOR_KEY), mockValidatorV2, "Should be upgraded to V2");

        PlatformRegistry.ExtensionInfo memory info = registry.getExtensionInfo(VALIDATOR_KEY);
        assertEq(info.version, "2.0.0", "Version should be updated");
    }

    function testDeactivateAndActivateExtension() public {
        // Deactivate FounderNFT
        vm.prank(owner);
        registry.deactivateExtension(FOUNDER_NFT_KEY);

        assertFalse(registry.isExtensionRegistered(FOUNDER_NFT_KEY), "Should be deactivated");
        assertTrue(registry.extensionExists(FOUNDER_NFT_KEY), "Should still exist");

        // Reactivate
        vm.prank(owner);
        registry.activateExtension(FOUNDER_NFT_KEY);

        assertTrue(registry.isExtensionRegistered(FOUNDER_NFT_KEY), "Should be reactivated");
    }

    function testRemoveExtension() public {
        address mockValidator = makeAddr("mockValidator");

        // Register extension first
        vm.prank(owner);
        registry.registerExtension(
            VALIDATOR_KEY,
            mockValidator,
            CATEGORY_VALIDATOR,
            "Mock Validator",
            "1.0.0",
            "Validates project milestones",
            new bytes32[](0)
        );

        vm.expectEmit(true, true, false, false);
        emit ExtensionRemoved(VALIDATOR_KEY, mockValidator);

        // Remove extension
        vm.prank(owner);
        registry.removeExtension(VALIDATOR_KEY);

        assertFalse(registry.isExtensionRegistered(VALIDATOR_KEY), "Should be removed");
        assertFalse(registry.extensionExists(VALIDATOR_KEY), "Should not exist");
        assertEq(registry.getExtension(VALIDATOR_KEY), address(0), "Address should be zero");
    }

    function testGetExtensionsByCategory() public {
        // Register multiple factory extensions
        address mockNFTFactory = makeAddr("mockNFTFactory");
        address mockTokenFactory = makeAddr("mockTokenFactory");

        vm.startPrank(owner);
        registry.registerExtension(
            NFT_FACTORY_KEY, mockNFTFactory, CATEGORY_FACTORY, "NFT Factory", "1.0.0", "Creates NFTs", new bytes32[](0)
        );

        registry.registerExtension(
            TOKEN_FACTORY_KEY,
            mockTokenFactory,
            CATEGORY_FACTORY,
            "Token Factory",
            "1.0.0",
            "Creates tokens",
            new bytes32[](0)
        );
        vm.stopPrank();

        // Get factory extensions
        (bytes32[] memory keys, address[] memory addresses) = registry.getExtensionsByCategory(CATEGORY_FACTORY);

        assertEq(keys.length, 3, "Should have 3 factory extensions"); // Including PROJECT_FACTORY
        assertEq(addresses.length, 3, "Should have 3 factory addresses");

        // Verify our new factories are included
        bool foundNFTFactory = false;
        bool foundTokenFactory = false;
        bool foundProjectFactory = false;

        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i] == NFT_FACTORY_KEY) foundNFTFactory = true;
            if (keys[i] == TOKEN_FACTORY_KEY) foundTokenFactory = true;
            if (keys[i] == PROJECT_FACTORY_KEY) foundProjectFactory = true;
        }

        assertTrue(foundNFTFactory, "NFT Factory should be found");
        assertTrue(foundTokenFactory, "Token Factory should be found");
        assertTrue(foundProjectFactory, "Project Factory should be found");
    }

    function testGetAllExtensions() public {
        (bytes32[] memory keys, PlatformRegistry.ExtensionInfo[] memory extensions) = registry.getAllExtensions();

        assertGt(keys.length, 0, "Should have extensions");
        assertEq(keys.length, extensions.length, "Arrays should have same length");

        // Should include our registered extensions
        bool foundFounderNFT = false;
        bool foundProjectFactory = false;

        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i] == FOUNDER_NFT_KEY) foundFounderNFT = true;
            if (keys[i] == PROJECT_FACTORY_KEY) foundProjectFactory = true;
        }

        assertTrue(foundFounderNFT, "Should find FounderNFT");
        assertTrue(foundProjectFactory, "Should find ProjectFactory");
    }

    function testFactoryValidation() public {
        // Test that registered factory is recognized
        assertTrue(registry.isFactoryRegistered(address(mockFactory)), "MockFactory should be registered");

        // Test unregistered factory
        address fakeFactory = makeAddr("fakeFactory");
        assertFalse(registry.isFactoryRegistered(fakeFactory), "Fake factory should not be registered");
    }

    // ============================================================================
    // PROJECT MANAGEMENT TESTS
    // ============================================================================

    function testRegisterProject() public {
        address testProject = makeAddr("testProject");

        // Mock factory registers project
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        assertTrue(registry.isProjectRegistered(testProject), "Project should be registered");
    }

    function testRegisterProjectUnauthorized() public {
        address testProject = makeAddr("testProject");

        // Non-factory tries to register project
        vm.prank(user1);
        vm.expectRevert("Only registered factories can register projects");
        registry.registerProject(testProject);
    }

    function testDeregisterProject() public {
        address testProject = makeAddr("testProject");

        // Register project first
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        // Admin deregisters project
        vm.prank(owner);
        registry.deregisterProject(testProject);

        assertFalse(registry.isProjectRegistered(testProject), "Project should be deregistered");
    }

    // ============================================================================
    // FEE DISTRIBUTION TESTS
    // ============================================================================

    function testDistributePlatformFeesSuccess() public {
        // Register a test project
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        // Setup mock FounderNFT with stakers
        mockFounderNFT.setTotalStakedTokens(100);

        uint256 feeAmount = 1 ether;
        uint256 founderBalanceBefore = address(mockFounderNFT).balance;
        uint256 treasuryBalanceBefore = treasury.balance;

        // Distribute fees from registered project
        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // Calculate expected distribution (50-50 split)
        uint256 expectedFounderShare = (feeAmount * 5000) / 10000; // 50%
        uint256 expectedTreasuryShare = feeAmount - expectedFounderShare;

        // Verify distribution
        assertEq(treasury.balance, treasuryBalanceBefore + expectedTreasuryShare, "Treasury should receive 50%");
        // Note: FounderNFT balance check depends on relay mechanism implementation
    }

    function testDistributePlatformFeesUnregisteredProject() public {
        address unregisteredProject = makeAddr("unregistered");
        vm.deal(unregisteredProject, 1 ether);

        vm.prank(unregisteredProject);
        vm.expectRevert("Only registered projects");
        registry.distributePlatformFees{value: 1 ether}(1 ether);
    }

    function testDistributePlatformFeesMismatchedValue() public {
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        vm.expectRevert("Sent ETH must match total fee");
        registry.distributePlatformFees{value: 0.5 ether}(1 ether);
    }

    function testDistributePlatformFeesNoStakers() public {
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        // No stakers in FounderNFT
        mockFounderNFT.setTotalStakedTokens(0);

        uint256 feeAmount = 1 ether;
        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // Should accumulate as pending fees
        uint256 pendingFees = registry.getPendingFounderFees();
        assertGt(pendingFees, 0, "Should have pending founder fees");
    }

    function testRelayFounderFees() public {
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        uint256 feeAmount = 0.5 ether;
        uint256 founderBalanceBefore = address(mockFounderNFT).balance;

        vm.deal(testProject, 1 ether);
        vm.prank(testProject);
        registry.relayFounderFees{value: feeAmount}(feeAmount);

        assertEq(
            address(mockFounderNFT).balance, founderBalanceBefore + feeAmount, "FounderNFT should receive relayed fees"
        );
    }

    function testDistributePendingFounderFees() public {
        // First create pending fees by distributing with no stakers
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        mockFounderNFT.setTotalStakedTokens(0);

        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        uint256 pendingBefore = registry.getPendingFounderFees();
        assertGt(pendingBefore, 0, "Should have pending fees");

        // Now add stakers and distribute pending
        mockFounderNFT.setTotalStakedTokens(100);
        uint256 founderBalanceBefore = address(mockFounderNFT).balance;

        vm.prank(owner);
        registry.distributePendingFounderFees();

        assertGt(address(mockFounderNFT).balance, founderBalanceBefore, "Should receive pending fees");
        assertEq(registry.getPendingFounderFees(), 0, "Pending fees should be cleared");
    }

    // ============================================================================
    // EMERGENCY CONTROLS TESTS
    // ============================================================================

    function testEmergencyFreeze() public {
        address emergencyRecipient = makeAddr("emergency");

        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        (bool frozen, address recipient) = registry.getEmergencyStatus();
        assertTrue(frozen, "Should be frozen");
        assertEq(recipient, emergencyRecipient, "Emergency recipient should be set");

        // Test that fee distribution is blocked
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        vm.deal(testProject, 1 ether);
        vm.prank(testProject);
        vm.expectRevert("Fee distribution frozen");
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        // Unfreeze
        vm.prank(owner);
        registry.toggleEmergencyFreeze(false, address(0));

        (bool frozenAfter,) = registry.getEmergencyStatus();
        assertFalse(frozenAfter, "Should be unfrozen");
    }

    function testEmergencyWithdrawPendingFees() public {
        // Create pending fees
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        mockFounderNFT.setTotalStakedTokens(0); // No stakers

        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        uint256 pendingFees = registry.getPendingFounderFees();
        assertGt(pendingFees, 0, "Should have pending fees");

        uint256 treasuryBalanceBefore = treasury.balance;

        vm.prank(owner);
        registry.emergencyWithdrawPendingFees();

        assertGt(treasury.balance, treasuryBalanceBefore, "Treasury should receive emergency withdrawal");
        assertEq(registry.getPendingFounderFees(), 0, "Pending fees should be cleared");
    }

    // ============================================================================
    // VIEW FUNCTION TESTS
    // ============================================================================

    function testGetFeeStats() public {
        (
            uint256 founderPercentage,
            uint256 treasuryPercentage,
            uint256 totalFounderFees,
            uint256 totalTreasuryFees,
            uint256 pendingFounderFees
        ) = registry.getFeeStats();

        assertEq(founderPercentage, 5000, "Founder percentage should be 50%");
        assertEq(treasuryPercentage, 5000, "Treasury percentage should be 50%");
        assertEq(totalFounderFees, 0, "Initial founder fees should be 0");
        assertEq(totalTreasuryFees, 0, "Initial treasury fees should be 0");
        assertEq(pendingFounderFees, 0, "Initial pending fees should be 0");
    }

    function testExtensionCount() public {
        uint256 initialCount = registry.getExtensionCount();
        assertEq(initialCount, 2, "Should have 2 initial extensions"); // FounderNFT + ProjectFactory

        // Register another extension
        vm.prank(owner);
        registry.registerExtension(
            ORACLE_KEY, makeAddr("oracle"), CATEGORY_ORACLE, "Oracle", "1.0.0", "Price oracle", new bytes32[](0)
        );

        assertEq(registry.getExtensionCount(), initialCount + 1, "Count should increase");
    }

    function testExtensionPermissions() public {
        bytes32[] memory permissions = new bytes32[](2);
        permissions[0] = keccak256("READ_ACCESS");
        permissions[1] = keccak256("WRITE_ACCESS");

        vm.prank(owner);
        registry.registerExtension(
            ORACLE_KEY, makeAddr("oracle"), CATEGORY_ORACLE, "Oracle", "1.0.0", "Price oracle", permissions
        );

        assertTrue(registry.extensionHasPermission(ORACLE_KEY, keccak256("READ_ACCESS")), "Should have read access");
        assertTrue(registry.extensionHasPermission(ORACLE_KEY, keccak256("WRITE_ACCESS")), "Should have write access");
        assertFalse(
            registry.extensionHasPermission(ORACLE_KEY, keccak256("ADMIN_ACCESS")), "Should not have admin access"
        );
    }

    function testGenerateExtensionKey() public view {
        bytes32 generated = registry.generateExtensionKey("MY_EXTENSION");
        bytes32 expected = keccak256(abi.encodePacked("MY_EXTENSION"));
        assertEq(generated, expected, "Generated key should match expected");
    }

    // ============================================================================
    // UPGRADE TESTS
    // ============================================================================

    function testUpgrade() public {
        PlatformRegistry newImplementation = new PlatformRegistry();

        vm.recordLogs();
        vm.prank(owner);
        registry.upgradeToAndCall(address(newImplementation), "");

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 upgradeEventSignature = keccak256("Upgraded(address)");

        bool foundEvent = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == upgradeEventSignature) {
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "Upgraded event not emitted");
        assertEq(registry.getPlatformFeePercentage(), 500, "State not preserved after upgrade");
    }

    function testUpgradeUnauthorized() public {
        PlatformRegistry newImplementation = new PlatformRegistry();

        vm.prank(user1);
        vm.expectRevert();
        registry.upgradeToAndCall(address(newImplementation), "");
    }

    // ============================================================================
    // ACCESS CONTROL TESTS
    // ============================================================================

    function testUnauthorizedExtensionManagement() public {
        vm.prank(user1);
        vm.expectRevert();
        registry.registerExtension(
            ORACLE_KEY, makeAddr("oracle"), CATEGORY_ORACLE, "Oracle", "1.0.0", "Description", new bytes32[](0)
        );

        vm.prank(user1);
        vm.expectRevert();
        registry.removeExtension(FOUNDER_NFT_KEY);

        vm.prank(user1);
        vm.expectRevert();
        registry.updateFeeDistribution(6000, 4000);
    }

    // ============================================================================
    // EDGE CASES AND ERROR HANDLING
    // ============================================================================

    function testRegisterExtensionEmptyName() public {
        vm.prank(owner);
        vm.expectRevert("Name cannot be empty");
        registry.registerExtension(
            ORACLE_KEY,
            makeAddr("oracle"),
            CATEGORY_ORACLE,
            "", // Empty name
            "1.0.0",
            "Description",
            new bytes32[](0)
        );
    }

    function testRegisterExtensionEmptyVersion() public {
        vm.prank(owner);
        vm.expectRevert("Version cannot be empty");
        registry.registerExtension(
            ORACLE_KEY,
            makeAddr("oracle"),
            CATEGORY_ORACLE,
            "Oracle",
            "", // Empty version
            "Description",
            new bytes32[](0)
        );
    }

    function testUpgradeNonexistentExtension() public {
        vm.prank(owner);
        vm.expectRevert("Extension does not exist");
        registry.upgradeExtension(keccak256("NONEXISTENT"), makeAddr("new"), "2.0.0");
    }

    function testActivateNonexistentExtension() public {
        vm.prank(owner);
        vm.expectRevert("Extension does not exist");
        registry.activateExtension(keccak256("NONEXISTENT"));
    }

    function testDeactivateAlreadyInactiveExtension() public {
        // First deactivate
        vm.prank(owner);
        registry.deactivateExtension(FOUNDER_NFT_KEY);

        // Try to deactivate again
        vm.prank(owner);
        vm.expectRevert("Extension already inactive");
        registry.deactivateExtension(FOUNDER_NFT_KEY);
    }

    function testActivateAlreadyActiveExtension() public {
        // Try to activate already active extension
        vm.prank(owner);
        vm.expectRevert("Extension already active");
        registry.activateExtension(FOUNDER_NFT_KEY);
    }

    function testDistributePendingFeesWhenNone() public {
        vm.prank(owner);
        vm.expectRevert("No pending founder fees");
        registry.distributePendingFounderFees();
    }

    function testEmergencyWithdrawWhenNoPending() public {
        vm.prank(owner);
        vm.expectRevert("No pending fees");
        registry.emergencyWithdrawPendingFees();
    }

    function testToggleEmergencyFreezeInvalidRecipient() public {
        vm.prank(owner);
        vm.expectRevert("Emergency recipient required");
        registry.toggleEmergencyFreeze(true, address(0));
    }

    // ============================================================================
    // COMPLEX SCENARIOS
    // ============================================================================

    function testComplexFeeDistributionScenario() public {
        // Register project
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        // Update fee distribution to 70-30 split
        vm.prank(owner);
        registry.updateFeeDistribution(7000, 3000);

        // Setup FounderNFT with custom distribution percentage
        mockFounderNFT.setTotalStakedTokens(50);
        mockFounderNFT.setPlatformFeeDistributionPercentage(8000); // 80% to founders

        uint256 feeAmount = 10 ether;
        uint256 treasuryBalanceBefore = treasury.balance;

        // Distribute fees
        vm.deal(testProject, 15 ether);
        vm.prank(testProject);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // Expected: 70% of total fee goes to founder portion, 30% to treasury
        uint256 expectedFounderPortion = (feeAmount * 7000) / 10000; // 7 ETH
        uint256 expectedTreasuryPortion = (feeAmount * 3000) / 10000; // 3 ETH

        // Verify treasury received its portion
        assertEq(
            treasury.balance,
            treasuryBalanceBefore + expectedTreasuryPortion,
            "Treasury should receive 30% of total fee"
        );

        // Verify fee tracking
        assertEq(registry.getTotalFeesReceived(treasury), expectedTreasuryPortion, "Treasury fee tracking should match");
    }

    function testMultipleExtensionLifecycle() public {
        // Register multiple extensions
        address oracle1 = makeAddr("oracle1");
        address oracle2 = makeAddr("oracle2");
        address validator1 = makeAddr("validator1");

        vm.startPrank(owner);

        // Register Oracle v1
        registry.registerExtension(
            ORACLE_KEY, oracle1, CATEGORY_ORACLE, "Oracle", "1.0.0", "Price oracle v1", new bytes32[](0)
        );

        // Register Validator
        registry.registerExtension(
            VALIDATOR_KEY, validator1, CATEGORY_VALIDATOR, "Validator", "1.0.0", "Milestone validator", new bytes32[](0)
        );

        // Upgrade Oracle to v2
        registry.upgradeExtension(ORACLE_KEY, oracle2, "2.0.0");

        // Deactivate Validator
        registry.deactivateExtension(VALIDATOR_KEY);

        vm.stopPrank();

        // Verify final state
        assertEq(registry.getExtension(ORACLE_KEY), oracle2, "Oracle should be v2");
        assertTrue(registry.isExtensionRegistered(ORACLE_KEY), "Oracle should be active");

        assertEq(registry.getExtension(VALIDATOR_KEY), validator1, "Validator address unchanged");
        assertFalse(registry.isExtensionRegistered(VALIDATOR_KEY), "Validator should be inactive");
        assertTrue(registry.extensionExists(VALIDATOR_KEY), "Validator should still exist");

        // Test extension count
        uint256 totalExtensions = registry.getExtensionCount();
        assertEq(totalExtensions, 3, "Should have 3 active extensions"); // FounderNFT, ProjectFactory, Oracle

        // Test getting all extensions
        (bytes32[] memory keys, PlatformRegistry.ExtensionInfo[] memory extensions) = registry.getAllExtensions();
        assertEq(keys.length, 3, "Should return 3 active extensions");

        // Verify Oracle v2 is in the list
        bool foundOracleV2 = false;
        for (uint256 i = 0; i < extensions.length; i++) {
            if (keys[i] == ORACLE_KEY) {
                assertEq(extensions[i].version, "2.0.0", "Should be Oracle v2");
                foundOracleV2 = true;
            }
        }
        assertTrue(foundOracleV2, "Should find Oracle v2 in active extensions");
    }

    function testExtensionRoleManagement() public {
        // Test that FounderNFT gets special role treatment
        assertTrue(
            registry.hasRole(registry.FEE_MANAGER_ROLE(), address(mockFounderNFT)),
            "FounderNFT should have FEE_MANAGER_ROLE"
        );

        // Remove FounderNFT extension
        vm.prank(owner);
        registry.removeExtension(FOUNDER_NFT_KEY);

        // Role should be revoked
        assertFalse(
            registry.hasRole(registry.FEE_MANAGER_ROLE(), address(mockFounderNFT)),
            "FounderNFT should lose FEE_MANAGER_ROLE when removed"
        );

        // Re-register FounderNFT
        vm.prank(owner);
        registry.registerExtension(
            FOUNDER_NFT_KEY,
            address(mockFounderNFT),
            CATEGORY_NFT,
            "Mock Founder NFT",
            "1.1.0",
            "Re-registered NFT",
            new bytes32[](0)
        );

        // Role should be granted again
        assertTrue(
            registry.hasRole(registry.FEE_MANAGER_ROLE(), address(mockFounderNFT)),
            "FounderNFT should regain FEE_MANAGER_ROLE when re-registered"
        );
    }

    function testExtensionKeyUtilities() public view {
        // Test key generation utility
        bytes32 generated1 = registry.generateExtensionKey("MY_EXTENSION");
        bytes32 generated2 = registry.generateExtensionKey("MY_EXTENSION");
        bytes32 different = registry.generateExtensionKey("DIFFERENT_EXTENSION");

        assertEq(generated1, generated2, "Same input should generate same key");
        assertTrue(generated1 != different, "Different inputs should generate different keys");

        // Test expected key format
        bytes32 expected = keccak256(abi.encodePacked("MY_EXTENSION"));
        assertEq(generated1, expected, "Generated key should match keccak256 hash");
    }

    function testGetFeeRecipients() public view {
        (address founderNFT, address treasuryAddr) = registry.getFeeRecipients();

        assertEq(founderNFT, address(mockFounderNFT), "FounderNFT address should match");
        assertEq(treasuryAddr, treasury, "Treasury address should match");
    }

    // ============================================================================
    // PERFORMANCE AND GAS TESTS
    // ============================================================================

    function testBatchExtensionOperations() public {
        // Register multiple extensions in sequence
        address[] memory implementations = new address[](5);
        bytes32[] memory keys = new bytes32[](5);

        for (uint256 i = 0; i < 5; i++) {
            implementations[i] = makeAddr(string(abi.encodePacked("extension", i)));
            keys[i] = keccak256(abi.encodePacked("EXTENSION_", i));
        }

        vm.startPrank(owner);
        for (uint256 i = 0; i < 5; i++) {
            registry.registerExtension(
                keys[i],
                implementations[i],
                CATEGORY_UTILITY,
                string(abi.encodePacked("Extension ", i)),
                "1.0.0",
                "Batch registered extension",
                new bytes32[](0)
            );
        }
        vm.stopPrank();

        // Verify all were registered
        assertEq(registry.getExtensionCount(), 7, "Should have 7 total extensions"); // 2 initial + 5 new

        // Test batch querying
        (bytes32[] memory allKeys, PlatformRegistry.ExtensionInfo[] memory allExtensions) = registry.getAllExtensions();
        assertEq(allKeys.length, 7, "Should return all active extensions");
        assertEq(allExtensions.length, 7, "Should return all extension info");
    }

    // ============================================================================
    // INTEGRATION WITH MOCKS
    // ============================================================================

    function testMockFounderNFTFailures() public {
        address testProject = makeAddr("testProject");
        vm.prank(address(mockFactory));
        registry.registerProject(testProject);

        // Test failure in stake check
        mockFounderNFT.setShouldFailStakeCheck(true);

        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        // Should still work, but founder fees go to pending
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        uint256 pendingFees = registry.getPendingFounderFees();
        assertGt(pendingFees, 0, "Should have pending fees when stake check fails");

        // Reset and test failure in add fees
        mockFounderNFT.setShouldFailStakeCheck(false);
        mockFounderNFT.setTotalStakedTokens(100);
        mockFounderNFT.setShouldFailAddFees(true);

        vm.deal(testProject, 2 ether);
        vm.prank(testProject);
        // Should still work, ETH should be sent even if notification fails
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        // Fee tracking should still work
        assertGt(
            registry.getTotalFeesReceived(address(mockFounderNFT)), 0, "Should track fees even if notification fails"
        );
    }

    function testVersion() public view {
        assertEq(registry.getVersion(), "2.0.0", "Version should be 2.0.0");
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function createTestProject() internal returns (address) {
        address[] memory teamMembers = new address[](0);
        return mockFactory.createProject(
            owner, "Test Project", "Test Description", 1 ether, 30 days, false, 500, treasury, teamMembers
        );
    }
}
