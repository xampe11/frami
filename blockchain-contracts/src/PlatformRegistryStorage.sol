// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PlatformRegistryStorage
 * @dev Storage contract for PlatformRegistry to avoid storage collisions during upgrades
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

    // Extension registry - mapping extension type to implementation address
    mapping(bytes32 => address) internal _extensions;

    // For future token support - keeping storage slots reserved
    // This ensures that when we add token support later, we won't have storage collision issues
    mapping(address => bool) internal _reservedTokenSlot;

    // Reserve storage slots to allow for layout changes in the future
    uint256[50] private __gap;
}
