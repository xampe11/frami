// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PlatformRegistryStorage
 * @dev Storage contract for PlatformRegistry with enhanced fee distribution
 */
contract PlatformRegistryStorage {
    // Platform configuration
    uint256 internal _platformFeePercentage;
    address internal _platformTreasury;

    // Project tracking
    mapping(address => bool) internal _registeredProjects;
    address[] internal _allProjects;

    // Implementation version
    string internal _version;

    // Extension registry
    mapping(bytes32 => address) internal _extensions;

    // ============================================================================
    // ENHANCED FEE DISTRIBUTION STORAGE
    // ============================================================================

    struct FeeDistribution {
        uint256 founderNFTPercentage; // e.g., 5000 = 50%
        uint256 treasuryPercentage; // e.g., 5000 = 50%
    }

    // Fee distribution configuration
    FeeDistribution internal _feeDistribution;

    // Fee tracking for transparency
    mapping(address => uint256) internal _totalFeesReceived; // recipient => total fees
    mapping(address => uint256) internal _lastFeeDistribution; // recipient => last amount

    // Pending fees for failed distributions
    uint256 internal _pendingFounderFees;

    // Emergency controls
    bool internal _emergencyFreezeDistribution;
    address internal _emergencyFeeRecipient;

    // Future expansion - reserved for additional recipients
    mapping(bytes32 => address) internal _futureRecipients;
    mapping(bytes32 => uint256) internal _futureRecipientPercentages;

    // Reserve storage slots for future features
    uint256[40] private __gap;
}
