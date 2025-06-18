// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {ProjectFactory} from "../../src/ProjectFactory.sol";

// Mock contracts for testing
contract MockFounderNFT {
    uint256 public totalStakedTokens;
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

    function getTotalStakedTokens() external view returns (uint256) {
        if (shouldFailStakeCheck) {
            revert("Stake check failed");
        }
        return totalStakedTokens;
    }

    function addPlatformFees(uint256 amount) external {
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

    address public owner;
    address public treasury;
    address public factory;
    address public user1;
    address public user2;
    address public feeManager;
    address public emergencyRecipient;

    // Events to test
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event FeeDistributionUpdated(uint256 founderPercentage, uint256 treasuryPercentage);
    event FeesDistributed(address indexed project, uint256 totalFee, uint256 founderAmount, uint256 treasuryAmount);
    event PendingFeesDistributed(uint256 amount, address indexed recipient);
    event EmergencyDistributionToggled(bool frozen, address indexed emergencyRecipient);
    event FutureRecipientAdded(bytes32 indexed recipientType, address indexed recipient, uint256 percentage);
    event FutureRecipientRemoved(bytes32 indexed recipientType);

    function setUp() public {
        owner = address(this);
        treasury = makeAddr("treasury");
        factory = makeAddr("factory");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        feeManager = makeAddr("feeManager");
        emergencyRecipient = makeAddr("emergencyRecipient");

        // Deploy implementation
        implementation = new PlatformRegistry();

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500, // 5% platform fee
            treasury,
            factory
        );

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        registry = PlatformRegistry(payable(address(proxy)));

        // Deploy mock contracts
        mockFounderNFT = new MockFounderNFT();

        // Register FounderNFT extension
        vm.prank(owner);
        registry.registerExtension(registry.FOUNDER_NFT_EXTENSION(), address(mockFounderNFT));

        // Setup roles
        vm.prank(owner);
        registry.grantRole(registry.FEE_MANAGER_ROLE(), feeManager);

        // Give contracts some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============================================================================
    // INITIALIZATION TESTS
    // ============================================================================

    function testInitialization() public view {
        assertEq(registry.platformFeePercentage(), 500, "Wrong platform fee");
        assertEq(registry.platformTreasury(), treasury, "Wrong treasury address");
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), owner), "Owner should have ADMIN_ROLE");
        assertTrue(registry.hasRole(registry.UPGRADER_ROLE(), owner), "Owner should have UPGRADER_ROLE");
        assertTrue(registry.hasRole(registry.FEE_MANAGER_ROLE(), owner), "Owner should have FEE_MANAGER_ROLE");

        // Check initial fee distribution (50-50)
        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 5000, "Initial founder percentage should be 50%");
        assertEq(treasuryPct, 5000, "Initial treasury percentage should be 50%");
    }

    // ============================================================================
    // FEE DISTRIBUTION CONFIGURATION TESTS
    // ============================================================================

    function testUpdateFeeDistribution() public {
        vm.expectEmit(true, true, true, true);
        emit FeeDistributionUpdated(6000, 4000);

        vm.prank(feeManager);
        registry.updateFeeDistribution(6000, 4000); // 60% founder, 40% treasury

        (uint256 founderPct, uint256 treasuryPct) = registry.getFeeDistribution();
        assertEq(founderPct, 6000, "Founder percentage not updated");
        assertEq(treasuryPct, 4000, "Treasury percentage not updated");
    }

    function testUpdateFeeDistributionInvalidSum() public {
        vm.prank(feeManager);
        vm.expectRevert("Percentages must sum to 10000 (100%)");
        registry.updateFeeDistribution(6000, 5000); // Sum = 110%
    }

    function testUpdateFeeDistributionUnauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        registry.updateFeeDistribution(6000, 4000);
    }

    // ============================================================================
    // FEE DISTRIBUTION FUNCTIONALITY TESTS
    // ============================================================================

    function testDistributePlatformFeesSuccess() public {
        // Create a registered project
        address projectAddress = createTestProject();

        // Setup: FounderNFT has staked tokens
        mockFounderNFT.setTotalStakedTokens(100);

        uint256 feeAmount = 1 ether;
        uint256 expectedFounderAmount = (feeAmount * 5000) / 10000; // 50%
        uint256 expectedTreasuryAmount = feeAmount - expectedFounderAmount;

        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 founderNFTBalanceBefore = address(mockFounderNFT).balance;

        vm.expectEmit(true, true, true, true);
        emit FeesDistributed(projectAddress, feeAmount, expectedFounderAmount, expectedTreasuryAmount);

        // Call from the created project
        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // Check balances
        assertEq(treasury.balance, treasuryBalanceBefore + expectedTreasuryAmount, "Treasury balance incorrect");
        assertEq(
            address(mockFounderNFT).balance,
            founderNFTBalanceBefore + expectedFounderAmount,
            "FounderNFT balance incorrect"
        );

        // Check tracking
        assertEq(registry.getTotalFeesReceived(treasury), expectedTreasuryAmount, "Treasury fees tracking incorrect");
        assertEq(
            registry.getTotalFeesReceived(address(mockFounderNFT)),
            expectedFounderAmount,
            "FounderNFT fees tracking incorrect"
        );
    }

    function testDistributePlatformFeesNoStakers() public {
        address projectAddress = createTestProject();

        // Setup: No staked tokens
        mockFounderNFT.setTotalStakedTokens(0);

        uint256 feeAmount = 1 ether;
        uint256 expectedFounderAmount = (feeAmount * 5000) / 10000;
        uint256 expectedTreasuryAmount = feeAmount - expectedFounderAmount;

        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 pendingFeesBefore = registry.getPendingFounderFees();

        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // Check treasury got its share
        assertEq(treasury.balance, treasuryBalanceBefore + expectedTreasuryAmount, "Treasury balance incorrect");

        // Check founder fees went to pending
        assertEq(
            registry.getPendingFounderFees(), pendingFeesBefore + expectedFounderAmount, "Pending fees not updated"
        );
    }

    function testDistributePlatformFeesNoFounderNFT() public {
        address projectAddress = createTestProject();

        // Remove FounderNFT extension
        vm.prank(owner);
        registry.removeExtension(registry.FOUNDER_NFT_EXTENSION());

        uint256 feeAmount = 1 ether;
        uint256 expectedFounderAmount = (feeAmount * 5000) / 10000;
        uint256 expectedTreasuryAmount = feeAmount - expectedFounderAmount;

        uint256 pendingFeesBefore = registry.getPendingFounderFees();

        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // All founder fees should go to pending
        assertEq(
            registry.getPendingFounderFees(), pendingFeesBefore + expectedFounderAmount, "Pending fees not updated"
        );
        assertEq(treasury.balance, expectedTreasuryAmount, "Treasury balance incorrect");
    }

    function testDistributePlatformFeesUnregisteredProject() public {
        address unregisteredProject = makeAddr("unregistered");
        vm.deal(unregisteredProject, 1 ether);

        vm.prank(unregisteredProject);
        vm.expectRevert("Only registered projects");
        registry.distributePlatformFees{value: 1 ether}(1 ether);
    }

    function testDistributePlatformFeesMismatchedValue() public {
        address projectAddress = createTestProject();

        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        vm.expectRevert("Sent ETH must match total fee");
        registry.distributePlatformFees{value: 0.5 ether}(1 ether);
    }

    function testDistributePlatformFeesZeroAmount() public {
        address projectAddress = createTestProject();

        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        vm.expectRevert("Fee must be greater than 0");
        registry.distributePlatformFees{value: 0}(0);
    }

    function testDistributePlatformFeesWhenFrozen() public {
        address projectAddress = createTestProject();

        // Freeze fee distribution
        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        vm.expectRevert("Fee distribution frozen");
        registry.distributePlatformFees{value: 1 ether}(1 ether);
    }

    function testDistributePlatformFeesFounderTransferFails() public {
        address projectAddress = createTestProject();

        // Setup a contract that will reject ETH transfers
        address rejectingContract = address(new RejectingContract());
        vm.prank(owner);
        registry.removeExtension(registry.FOUNDER_NFT_EXTENSION());
        vm.prank(owner);
        registry.registerExtension(registry.FOUNDER_NFT_EXTENSION(), rejectingContract);

        uint256 feeAmount = 1 ether;
        uint256 expectedFounderAmount = (feeAmount * 5000) / 10000;

        uint256 pendingFeesBefore = registry.getPendingFounderFees();

        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: feeAmount}(feeAmount);

        // Founder fees should go to pending when transfer fails
        assertEq(
            registry.getPendingFounderFees(), pendingFeesBefore + expectedFounderAmount, "Pending fees not updated"
        );
    }

    // ============================================================================
    // PENDING FEES MANAGEMENT TESTS
    // ============================================================================

    function testDistributePendingFounderFees() public {
        address projectAddress = createTestProject();

        // First, create some pending fees
        mockFounderNFT.setTotalStakedTokens(0);
        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        uint256 pendingAmount = registry.getPendingFounderFees();
        assertGt(pendingAmount, 0, "Should have pending fees");

        // Now add stakers and distribute pending fees
        mockFounderNFT.setTotalStakedTokens(100);
        uint256 founderBalanceBefore = address(mockFounderNFT).balance;

        vm.expectEmit(true, true, true, true);
        emit PendingFeesDistributed(pendingAmount, address(mockFounderNFT));

        vm.prank(owner);
        registry.distributePendingFounderFees();

        assertEq(registry.getPendingFounderFees(), 0, "Pending fees should be zero");
        assertEq(address(mockFounderNFT).balance, founderBalanceBefore + pendingAmount, "FounderNFT balance incorrect");
    }

    function testDistributePendingFounderFeesNoPending() public {
        vm.prank(owner);
        vm.expectRevert("No pending founder fees");
        registry.distributePendingFounderFees();
    }

    function testDistributePendingFounderFeesStillFails() public {
        address projectAddress = createTestProject();

        // Create pending fees
        mockFounderNFT.setTotalStakedTokens(0);
        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        // Keep no stakers, so distribution will fail again
        vm.prank(owner);
        vm.expectRevert("Pending fee distribution failed");
        registry.distributePendingFounderFees();
    }

    function testEmergencyWithdrawPendingFees() public {
        address projectAddress = createTestProject();

        // Create pending fees
        mockFounderNFT.setTotalStakedTokens(0);
        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        uint256 pendingAmount = registry.getPendingFounderFees();
        uint256 treasuryBalanceBefore = treasury.balance;

        vm.expectEmit(true, true, true, true);
        emit PendingFeesDistributed(pendingAmount, treasury);

        vm.prank(owner);
        registry.emergencyWithdrawPendingFees();

        assertEq(registry.getPendingFounderFees(), 0, "Pending fees should be zero");
        assertEq(treasury.balance, treasuryBalanceBefore + pendingAmount, "Treasury balance incorrect");
    }

    // ============================================================================
    // EMERGENCY CONTROLS TESTS
    // ============================================================================

    function testToggleEmergencyFreeze() public {
        vm.expectEmit(true, true, true, true);
        emit EmergencyDistributionToggled(true, emergencyRecipient);

        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        (bool frozen, address recipient) = registry.getEmergencyStatus();
        assertTrue(frozen, "Should be frozen");
        assertEq(recipient, emergencyRecipient, "Emergency recipient incorrect");
    }

    function testToggleEmergencyFreezeInvalidRecipient() public {
        vm.prank(owner);
        vm.expectRevert("Emergency recipient required");
        registry.toggleEmergencyFreeze(true, address(0));
    }

    function testToggleEmergencyUnfreeze() public {
        // First freeze
        vm.prank(owner);
        registry.toggleEmergencyFreeze(true, emergencyRecipient);

        // Then unfreeze
        vm.prank(owner);
        registry.toggleEmergencyFreeze(false, address(0));

        (bool frozen,) = registry.getEmergencyStatus();
        assertFalse(frozen, "Should not be frozen");
    }

    // ============================================================================
    // FUTURE EXPANSION TESTS
    // ============================================================================

    function testAddFutureRecipient() public {
        address validatorPool = makeAddr("validatorPool");

        vm.expectEmit(true, true, true, true);
        emit FutureRecipientAdded(registry.VALIDATOR_RECIPIENT(), validatorPool, 1000);

        vm.prank(owner);
        registry.addFutureRecipient(registry.VALIDATOR_RECIPIENT(), validatorPool, 1000);

        // Note: The contract doesn't have getFutureRecipient function yet
        // This test verifies the event is emitted correctly
    }

    function testAddFutureRecipientInvalidAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid recipient");
        registry.addFutureRecipient(registry.VALIDATOR_RECIPIENT(), address(0), 1000);
    }

    function testAddFutureRecipientPercentageTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("Percentage too high");
        registry.addFutureRecipient(registry.VALIDATOR_RECIPIENT(), user1, 11000);
    }

    function testRemoveFutureRecipient() public {
        // First add a recipient
        vm.prank(owner);
        registry.addFutureRecipient(registry.VALIDATOR_RECIPIENT(), user1, 1000);

        vm.expectEmit(true, true, true, true);
        emit FutureRecipientRemoved(registry.VALIDATOR_RECIPIENT());

        // Then remove it
        vm.prank(owner);
        registry.removeFutureRecipient(registry.VALIDATOR_RECIPIENT());
    }

    function testRemoveFutureRecipientNotExists() public {
        vm.prank(owner);
        vm.expectRevert("Recipient does not exist");
        registry.removeFutureRecipient(registry.VALIDATOR_RECIPIENT());
    }

    // ============================================================================
    // ADMIN FUNCTION TESTS
    // ============================================================================

    function testUpdatePlatformFee() public {
        uint256 newFee = 300; // 3%
        registry.updatePlatformFee(newFee);
        assertEq(registry.platformFeePercentage(), newFee, "Fee not updated");
    }

    function testUpdatePlatformFeeTooHigh() public {
        uint256 newFee = 1100; // 11% - should fail as max is 10%
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
        registry.updateTreasury(newTreasury);
        assertEq(registry.platformTreasury(), newTreasury, "Treasury not updated");
    }

    function testUpdateTreasuryInvalidAddress() public {
        vm.expectRevert("Invalid treasury");
        registry.updateTreasury(address(0));
    }

    function testPauseUnpause() public {
        assertFalse(registry.paused(), "Should not be paused initially");

        registry.pausePlatform();
        assertTrue(registry.paused(), "Should be paused after pausePlatform");

        registry.unpausePlatform();
        assertFalse(registry.paused(), "Should not be paused after unpausePlatform");
    }

    function testRoleManagement() public {
        address newCreator = makeAddr("newCreator");
        assertFalse(registry.hasRole(registry.PROJECT_CREATOR_ROLE(), newCreator), "Should not have role initially");

        registry.grantProjectCreatorRole(newCreator);
        assertTrue(registry.hasRole(registry.PROJECT_CREATOR_ROLE(), newCreator), "Should have role after granting");

        registry.revokeRole(registry.PROJECT_CREATOR_ROLE(), newCreator);
        assertFalse(
            registry.hasRole(registry.PROJECT_CREATOR_ROLE(), newCreator), "Should not have role after revoking"
        );
    }

    // ============================================================================
    // VIEW FUNCTION TESTS
    // ============================================================================

    function testGetFeeStats() public {
        address projectAddress = createTestProject();

        // Distribute some fees first
        mockFounderNFT.setTotalStakedTokens(100);
        vm.deal(projectAddress, 2 ether);
        vm.prank(projectAddress);
        registry.distributePlatformFees{value: 1 ether}(1 ether);

        (
            uint256 founderPercentage,
            uint256 treasuryPercentage,
            uint256 totalFounderFees,
            uint256 totalTreasuryFees,
            uint256 pendingFounderFees
        ) = registry.getFeeStats();

        assertEq(founderPercentage, 5000, "Founder percentage incorrect");
        assertEq(treasuryPercentage, 5000, "Treasury percentage incorrect");
        assertGt(totalFounderFees, 0, "Should have founder fees");
        assertGt(totalTreasuryFees, 0, "Should have treasury fees");
        assertEq(pendingFounderFees, 0, "Should have no pending fees");
    }

    function testGetFeeRecipients() public {
        (address founderNFT, address treasuryAddr) = registry.getFeeRecipients();
        assertEq(founderNFT, address(mockFounderNFT), "FounderNFT address incorrect");
        assertEq(treasuryAddr, treasury, "Treasury address incorrect");
    }

    function testBasicViewFunctions() public {
        assertEq(registry.platformFeePercentage(), 500, "Platform fee incorrect");
        assertEq(registry.platformTreasury(), treasury, "Treasury address incorrect");
        assertEq(registry.getProjectCount(), 0, "Initial project count should be 0");
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), owner), "Owner should have admin role");
    }

    function testProjectCreationAndCounting() public {
        // Create a project
        address projectAddress = createTestProject();

        // Check project tracking
        assertEq(registry.getProjectCount(), 1, "Project count should be 1");
        assertTrue(registry.isProjectRegistered(projectAddress), "Project should be registered");

        address[] memory allProjects = registry.getAllProjects();
        assertEq(allProjects.length, 1, "Should have 1 project in array");
        assertEq(allProjects[0], projectAddress, "Project address should match");
    }

    function testExtensionManagement() public {
        address testExtension = makeAddr("testExtension");
        bytes32 testType = keccak256("TEST_EXTENSION");

        // Register extension
        vm.prank(owner);
        registry.registerExtension(testType, testExtension);

        assertEq(registry.getExtension(testType), testExtension, "Extension address should match");

        // Remove extension
        vm.prank(owner);
        registry.removeExtension(testType);

        assertEq(registry.getExtension(testType), address(0), "Extension should be removed");
    }

    // ============================================================================
    // UPGRADE TESTS
    // ============================================================================

    function testUpgrade() public {
        PlatformRegistry newImplementation = new PlatformRegistry();

        vm.recordLogs();
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
        assertEq(registry.platformFeePercentage(), 500, "State not preserved after upgrade");
    }

    function testVersion() public view {
        assertEq(registry.version(), "1.0.0", "Version should be 1.0.0");
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR TESTING
    // ============================================================================

    // Helper function to create a registered project for testing
    function createTestProject() internal returns (address) {
        vm.prank(owner);
        address[] memory teamMembers;
        return registry.createProject(owner, "Test Project", "Test Description", 1 ether, 30 days, false, teamMembers);
    }
}
