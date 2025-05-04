// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";
import {ProjectFactory} from "../../src/ProjectFactory.sol";
import {ProjectNFT} from "../../src/ProjectNFT.sol";

contract PlatformRegistryTest is Test {
    PlatformRegistry public implementation;
    PlatformRegistry public registry;
    ERC1967Proxy public proxy;

    address public owner;
    address public treasury;
    address public oracle;
    address public factory;
    address public user1;
    address public user2;

    event ProjectCreated(address indexed projectAddress, address indexed creator);

    function setUp() public {
        owner = address(this);
        treasury = makeAddr("treasury");
        oracle = makeAddr("oracle");
        factory = makeAddr("factory");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy implementation
        implementation = new PlatformRegistry();

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(
            PlatformRegistry.initialize.selector,
            owner,
            500, // 5% platform fee
            treasury,
            oracle,
            factory
        );

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        registry = PlatformRegistry(address(proxy));

        // Give users some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testInitialization() public view {
        assertEq(registry.platformFeePercentage(), 500, "Wrong platform fee");
        assertEq(registry.platformTreasury(), treasury, "Wrong treasury address");
        assertEq(registry.verificationOracle(), oracle, "Wrong oracle address");
        assertEq(registry.projectFactory(), factory, "Wrong factory address");
        assertTrue(registry.hasRole(registry.ADMIN_ROLE(), owner), "Owner should have ADMIN_ROLE");
        assertTrue(registry.hasRole(registry.UPGRADER_ROLE(), owner), "Owner should have UPGRADER_ROLE");
    }

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

    function testUpdateOracle() public {
        address newOracle = makeAddr("newOracle");
        registry.updateVerificationOracle(newOracle);
        assertEq(registry.verificationOracle(), newOracle, "Oracle not updated");
    }

    function testUpdateTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        registry.updateTreasury(newTreasury);
        assertEq(registry.platformTreasury(), newTreasury, "Treasury not updated");
    }

    function testUpdateFactory() public {
        address newFactory = makeAddr("newFactory");
        registry.updateProjectFactory(newFactory);
        assertEq(registry.projectFactory(), newFactory, "Factory not updated");
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

    function testUpgrade() public {
        // Deploy new implementation
        PlatformRegistry newImplementation = new PlatformRegistry();
        address newImplAddress = address(newImplementation);

        // Start recording logs
        vm.recordLogs();

        // Upgrade
        registry.upgradeToAndCall(address(newImplementation), "");

        // Get the recorded logs
        Vm.Log[] memory logs = vm.getRecordedLogs();

        // Define the expected event signature
        bytes32 upgradeEventSignature = keccak256("Upgraded(address)");

        // Find the Upgraded event and verify the implementation address
        bool foundEvent = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == upgradeEventSignature) {
                // The address parameter is in the second topic
                address upgradedAddress = address(uint160(uint256(logs[i].topics[1])));
                assertEq(upgradedAddress, newImplAddress, "Upgraded to wrong implementation");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "Upgraded event not emitted");

        // Verify state preserved
        assertEq(registry.platformFeePercentage(), 500, "State not preserved after upgrade");
    }
}
