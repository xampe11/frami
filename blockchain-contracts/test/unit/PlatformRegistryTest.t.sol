// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";
import {TokenInvestment} from "../../src/TokenInvestment.sol";
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

    function testInitialization() public {
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

    function testTokenSupport() public {
        address token = makeAddr("token");
        assertFalse(registry.isSupportedToken(token), "Token should not be supported initially");

        registry.addSupportedToken(token);
        assertTrue(registry.isSupportedToken(token), "Token should be supported after adding");

        registry.removeSupportedToken(token);
        assertFalse(registry.isSupportedToken(token), "Token should not be supported after removal");
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

        // Upgrade
        registry.upgradeToAndCall(address(newImplementation), "");

        // Verify upgrade successful
        address implementationAddress;
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        assembly {
            implementationAddress := sload(slot)
        }

        assertEq(implementationAddress, address(newImplementation), "Implementation not updated");

        // Verify state preserved
        assertEq(registry.platformFeePercentage(), 500, "State not preserved after upgrade");
    }
}
