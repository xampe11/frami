// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VerificationOracle is Ownable {
    // Verification providers (trusted validators)
    mapping(address => bool) public verifiers;
    uint256 public requiredVerifications;

    // Project milestone verification tracking
    struct VerificationRecord {
        uint256 approvalCount;
        mapping(address => bool) verifierApproved;
        bool isVerified;
    }

    // Project -> MilestoneID -> Verification Record
    mapping(address => mapping(uint256 => VerificationRecord)) public verifications;

    // Events
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event VerificationSubmitted(
        address indexed project, uint256 indexed milestoneId, address indexed verifier, bool approved
    );
    event MilestoneVerified(address indexed project, uint256 indexed milestoneId);

    // Constructor
    constructor(uint256 _requiredVerifications) Ownable(msg.sender) {
        requiredVerifications = _requiredVerifications;
    }

    // Verifier management
    function addVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    function updateRequiredVerifications(uint256 _required) external onlyOwner {
        requiredVerifications = _required;
    }

    // Submit verification for a project milestone
    function submitVerification(address _project, uint256 _milestoneId, bool _approved) external {
        require(verifiers[msg.sender], "Not authorized verifier");
        require(!verifications[_project][_milestoneId].verifierApproved[msg.sender], "Already verified");

        // Update verification records
        verifications[_project][_milestoneId].verifierApproved[msg.sender] = true;

        if (_approved) {
            verifications[_project][_milestoneId].approvalCount++;

            // Check if milestone now has enough verifications
            if (verifications[_project][_milestoneId].approvalCount >= requiredVerifications) {
                verifications[_project][_milestoneId].isVerified = true;
                emit MilestoneVerified(_project, _milestoneId);
            }
        }

        emit VerificationSubmitted(_project, _milestoneId, msg.sender, _approved);
    }

    // Check if milestone is verified
    function verifyMilestone(address _project, uint256 _milestoneId) external view returns (bool) {
        return verifications[_project][_milestoneId].isVerified;
    }

    // Get verification counts
    function getVerificationStatus(address _project, uint256 _milestoneId)
        external
        view
        returns (uint256 approvalCount, uint256 requiredCount, bool isVerified)
    {
        return (
            verifications[_project][_milestoneId].approvalCount,
            requiredVerifications,
            verifications[_project][_milestoneId].isVerified
        );
    }
}
