// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

contract VerificationOracleTest is Test {
    VerificationOracle public implementation;
    VerificationOracle public oracle;
    ERC1967Proxy public proxy;

    address public owner;
    address public verifier1;
    address public verifier2;
    address public projectAddr;

    function setUp() public {
        owner = address(this);
        verifier1 = makeAddr("verifier1");
        verifier2 = makeAddr("verifier2");
        projectAddr = makeAddr("project");

        // Deploy implementation
        implementation = new VerificationOracle();

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(
            VerificationOracle.initialize.selector,
            owner,
            2 // required verifications
        );

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        oracle = VerificationOracle(address(proxy));
    }

    function testInitialization() public view {
        assertEq(oracle.getRequiredVerifications(), 2, "Wrong required verifications");
        assertTrue(oracle.hasRole(oracle.ADMIN_ROLE(), owner), "Owner should have ADMIN_ROLE");
        assertTrue(oracle.hasRole(oracle.UPGRADER_ROLE(), owner), "Owner should have UPGRADER_ROLE");
    }

    function testVerifierManagement() public {
        assertFalse(oracle.isVerifier(verifier1), "Should not be a verifier initially");

        oracle.addVerifier(verifier1);
        assertTrue(oracle.isVerifier(verifier1), "Should be a verifier after adding");
        assertTrue(oracle.hasRole(oracle.VERIFIER_ROLE(), verifier1), "Should have VERIFIER_ROLE");

        oracle.removeVerifier(verifier1);
        assertFalse(oracle.isVerifier(verifier1), "Should not be a verifier after removal");
    }

    function testVerificationProcess() public {
        uint256 milestoneId = 0;

        // Add verifiers
        oracle.addVerifier(verifier1);
        oracle.addVerifier(verifier2);

        // Initial state
        (uint256 approvalCount, uint256 requiredCount, bool isVerified) =
            oracle.getVerificationStatus(projectAddr, milestoneId);
        assertEq(approvalCount, 0, "Initial approval count should be 0");
        assertEq(requiredCount, 2, "Required count should be 2");
        assertFalse(isVerified, "Should not be verified initially");

        // First verification
        vm.prank(verifier1);
        oracle.submitVerification(projectAddr, milestoneId, true);

        // Check status after first verification
        (approvalCount, requiredCount, isVerified) = oracle.getVerificationStatus(projectAddr, milestoneId);
        assertEq(approvalCount, 1, "Approval count should be 1 after first verification");
        assertFalse(isVerified, "Should not be verified with only one approval");

        // Second verification
        vm.prank(verifier2);
        oracle.submitVerification(projectAddr, milestoneId, true);

        // Check status after second verification
        (approvalCount, requiredCount, isVerified) = oracle.getVerificationStatus(projectAddr, milestoneId);
        assertEq(approvalCount, 2, "Approval count should be 2 after second verification");
        assertTrue(isVerified, "Should be verified after reaching required approvals");
        assertTrue(oracle.verifyMilestone(projectAddr, milestoneId), "verifyMilestone should return true");
    }

    function testRequiredVerificationsUpdate() public {
        uint256 newRequired = 3;
        oracle.updateRequiredVerifications(newRequired);
        assertEq(oracle.getRequiredVerifications(), newRequired, "Required verifications not updated");
    }

    function testVerifierRoleRequirement() public {
        // Non-verifier tries to submit verification
        vm.prank(makeAddr("nonVerifier"));
        vm.expectRevert();
        oracle.submitVerification(projectAddr, 0, true);
    }

    function testAlreadyVerified() public {
        // Add verifier
        oracle.addVerifier(verifier1);

        // Submit verification
        vm.prank(verifier1);
        oracle.submitVerification(projectAddr, 0, true);

        // Try to submit again
        vm.prank(verifier1);
        vm.expectRevert("Already verified");
        oracle.submitVerification(projectAddr, 0, true);
    }

    function testUpgrade() public {
        // Deploy new implementation
        VerificationOracle newImplementation = new VerificationOracle();

        // Upgrade
        oracle.upgradeToAndCall(address(newImplementation), "");

        // Verify upgrade successful
        address implementationAddress;
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        assembly {
            implementationAddress := sload(slot)
        }

        assertEq(implementationAddress, address(newImplementation), "Implementation not updated");

        // Verify state preserved
        assertEq(oracle.getRequiredVerifications(), 2, "State not preserved after upgrade");
    }
}
