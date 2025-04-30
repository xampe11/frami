// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";

contract VerificationOracleTest is Test {
    VerificationOracle public oracle;
    address public owner;
    address public verifier1;
    address public verifier2;
    address public verifier3;
    address public projectAddr;

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event VerificationSubmitted(
        address indexed project, uint256 indexed milestoneId, address indexed verifier, bool approved
    );
    event MilestoneVerified(address indexed project, uint256 indexed milestoneId);

    function setUp() public {
        owner = address(this);
        verifier1 = makeAddr("verifier1");
        verifier2 = makeAddr("verifier2");
        verifier3 = makeAddr("verifier3");
        projectAddr = makeAddr("project");

        // Create oracle requiring 2 verifications
        oracle = new VerificationOracle(2);

        // Add verifiers
        oracle.addVerifier(verifier1);
        oracle.addVerifier(verifier2);
        oracle.addVerifier(verifier3);
    }

    function testAddVerifier() public {
        address newVerifier = makeAddr("newVerifier");

        vm.expectEmit(true, false, false, false);
        emit VerifierAdded(newVerifier);

        oracle.addVerifier(newVerifier);

        assertTrue(oracle.verifiers(newVerifier), "Verifier not added");
    }

    function testRemoveVerifier() public {
        vm.expectEmit(true, false, false, false);
        emit VerifierRemoved(verifier1);

        oracle.removeVerifier(verifier1);

        assertFalse(oracle.verifiers(verifier1), "Verifier not removed");
    }

    function testUpdateRequiredVerifications() public {
        uint256 newRequired = 3;
        oracle.updateRequiredVerifications(newRequired);

        assertEq(oracle.requiredVerifications(), newRequired, "Required verifications not updated");
    }

    function testSubmitVerification() public {
        uint256 milestoneId = 0;

        // First verification
        vm.prank(verifier1);
        vm.expectEmit(true, true, true, true);
        emit VerificationSubmitted(projectAddr, milestoneId, verifier1, true);

        oracle.submitVerification(projectAddr, milestoneId, true);

        // Check verification status after first submission
        (uint256 approvalCount, uint256 requiredCount, bool isVerified) =
            oracle.getVerificationStatus(projectAddr, milestoneId);
        assertEq(approvalCount, 1, "Approval count mismatch");
        assertEq(requiredCount, 2, "Required count mismatch");
        assertFalse(isVerified, "Should not be verified yet");

        // Second verification (should trigger verification)
        vm.prank(verifier2);
        vm.expectEmit(true, true, false, false);
        emit MilestoneVerified(projectAddr, milestoneId);

        oracle.submitVerification(projectAddr, milestoneId, true);

        // Check verification status after second submission
        (approvalCount, requiredCount, isVerified) = oracle.getVerificationStatus(projectAddr, milestoneId);
        assertEq(approvalCount, 2, "Approval count mismatch");
        assertTrue(isVerified, "Should be verified");

        // Check direct verification
        assertTrue(oracle.verifyMilestone(projectAddr, milestoneId), "Milestone should be verified");
    }

    function testUnauthorizedVerifier() public {
        address unauthorizedAddr = makeAddr("unauthorized");
        uint256 milestoneId = 0;

        vm.prank(unauthorizedAddr);
        vm.expectRevert("Not authorized verifier");

        oracle.submitVerification(projectAddr, milestoneId, true);
    }

    function testDoubleVerification() public {
        uint256 milestoneId = 0;

        // First verification
        vm.prank(verifier1);
        oracle.submitVerification(projectAddr, milestoneId, true);

        // Try to verify again
        vm.prank(verifier1);
        vm.expectRevert("Already verified");

        oracle.submitVerification(projectAddr, milestoneId, true);
    }

    function testNegativeVerification() public {
        uint256 milestoneId = 0;

        // First verification (negative)
        vm.prank(verifier1);
        oracle.submitVerification(projectAddr, milestoneId, false);

        // Second verification (positive)
        vm.prank(verifier2);
        oracle.submitVerification(projectAddr, milestoneId, true);

        // Third verification (positive)
        vm.prank(verifier3);
        oracle.submitVerification(projectAddr, milestoneId, true);

        // Check verification status
        (uint256 approvalCount,, bool isVerified) = oracle.getVerificationStatus(projectAddr, milestoneId);
        assertEq(approvalCount, 2, "Approval count mismatch");
        assertTrue(isVerified, "Should be verified with 2 positives");
    }
}
