// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title VerificationOracleStorage
 * @dev Storage contract for VerificationOracle
 */
contract VerificationOracleStorage {
    // Verification providers (trusted validators)
    mapping(address => bool) internal _verifiers;
    uint256 internal _requiredVerifications;

    // Project milestone verification tracking
    struct VerificationRecord {
        uint256 approvalCount;
        mapping(address => bool) verifierApproved;
        bool isVerified;
    }

    // Project -> MilestoneID -> Verification Record
    mapping(address => mapping(uint256 => VerificationRecord)) internal _verifications;
}

/**
 * @title VerificationOracle
 * @dev Upgradeable oracle for milestone verification
 */
contract VerificationOracle is
    Initializable,
    VerificationOracleStorage,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Events
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event VerificationSubmitted(
        address indexed project, uint256 indexed milestoneId, address indexed verifier, bool approved
    );
    event MilestoneVerified(address indexed project, uint256 indexed milestoneId);
    event RequiredVerificationsUpdated(uint256 oldValue, uint256 newValue);

    /**
     * @dev Prevents initialization function from being called twice
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the oracle
     */
    function initialize(address initialOwner, uint256 requiredVerifications) external initializer {
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _requiredVerifications = requiredVerifications;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(VERIFIER_ROLE, initialOwner);
    }

    /**
     * @dev Add a verifier
     */
    function addVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        require(verifier != address(0), "Invalid verifier address");
        require(!_verifiers[verifier], "Already a verifier");

        _verifiers[verifier] = true;
        _grantRole(VERIFIER_ROLE, verifier);

        emit VerifierAdded(verifier);
    }

    /**
     * @dev Remove a verifier
     */
    function removeVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        require(_verifiers[verifier], "Not a verifier");

        _verifiers[verifier] = false;
        _revokeRole(VERIFIER_ROLE, verifier);

        emit VerifierRemoved(verifier);
    }

    /**
     * @dev Update required verifications
     */
    function updateRequiredVerifications(uint256 required) external onlyRole(ADMIN_ROLE) {
        require(required > 0, "Required verifications must be greater than 0");

        uint256 oldValue = _requiredVerifications;
        _requiredVerifications = required;

        emit RequiredVerificationsUpdated(oldValue, required);
    }

    /**
     * @dev Submit verification for a project milestone
     */
    function submitVerification(address project, uint256 milestoneId, bool approved) external onlyRole(VERIFIER_ROLE) {
        require(!_verifications[project][milestoneId].verifierApproved[msg.sender], "Already verified");

        // Update verification records
        _verifications[project][milestoneId].verifierApproved[msg.sender] = true;

        if (approved) {
            _verifications[project][milestoneId].approvalCount++;

            // Check if milestone now has enough verifications
            if (_verifications[project][milestoneId].approvalCount >= _requiredVerifications) {
                _verifications[project][milestoneId].isVerified = true;
                emit MilestoneVerified(project, milestoneId);
            }
        }

        emit VerificationSubmitted(project, milestoneId, msg.sender, approved);
    }

    /**
     * @dev Check if milestone is verified
     */
    function verifyMilestone(address project, uint256 milestoneId) external view returns (bool) {
        return _verifications[project][milestoneId].isVerified;
    }

    /**
     * @dev Get verification status
     */
    function getVerificationStatus(address project, uint256 milestoneId)
        external
        view
        returns (uint256 approvalCount, uint256 requiredCount, bool isVerified)
    {
        return (
            _verifications[project][milestoneId].approvalCount,
            _requiredVerifications,
            _verifications[project][milestoneId].isVerified
        );
    }

    /**
     * @dev Check if an address is a verifier
     */
    function isVerifier(address account) external view returns (bool) {
        return _verifiers[account];
    }

    /**
     * @dev Get required verifications
     */
    function getRequiredVerifications() external view returns (uint256) {
        return _requiredVerifications;
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }
}
