// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Project} from "./Project.sol";
import {PlatformRegistryStorage} from "./PlatformRegistryStorage.sol";
import {ExtensionKeys} from "./ExtensionKeys.sol";

/**
 * @title PlatformRegistry
 * @dev Main registry contract with standardized extension management
 */
contract PlatformRegistry is
    Initializable,
    PlatformRegistryStorage,
    OwnableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    // DEPRECATED: These constants are now in ExtensionKeys library
    // Keeping them for backward compatibility during transition
    bytes32 public constant NFT_FACTORY_EXTENSION = ExtensionKeys.NFT_FACTORY;
    bytes32 public constant TOKEN_FACTORY_EXTENSION = ExtensionKeys.TOKEN_FACTORY;
    bytes32 public constant FOUNDER_NFT_EXTENSION = ExtensionKeys.FOUNDER_NFT;

    // Events
    event PlatformFeeUpdated(uint256 newFee);
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event ExtensionRegistered(bytes32 indexed extensionType, address indexed extension);
    event ExtensionRemoved(bytes32 indexed extensionType);
    event FeeDistributionUpdated(uint256 founderPercentage, uint256 treasuryPercentage);
    event FeesDistributed(address indexed project, uint256 totalFee, uint256 founderAmount, uint256 treasuryAmount);
    event EmergencyDistributionToggled(bool frozen, address indexed emergencyRecipient);

    /**
     * @dev Initialize the contract
     */
    function initialize(
        address owner,
        uint256 initialPlatformFeePercentage,
        address initialPlatformTreasury,
        address projectFactory
    ) public initializer {
        require(owner != address(0), "Invalid owner");
        require(initialPlatformTreasury != address(0), "Invalid treasury");
        require(initialPlatformFeePercentage <= 1000, "Fee too high"); // max 10%

        __Ownable_init(owner);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _platformFeePercentage = initialPlatformFeePercentage;
        _platformTreasury = initialPlatformTreasury;
        _version = "1.0.0";

        // Initialize fee distribution with 50-50 split
        _feeDistribution = FeeDistribution({
            founderNFTPercentage: 5000, // 50%
            treasuryPercentage: 5000 // 50%
        });

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(ADMIN_ROLE, owner);
        _grantRole(UPGRADER_ROLE, owner);
        _grantRole(FEE_MANAGER_ROLE, owner);

        // Register initial factory if provided
        if (projectFactory != address(0)) {
            _extensions[ExtensionKeys.PROJECT_FACTORY] = projectFactory;
            emit ExtensionRegistered(ExtensionKeys.PROJECT_FACTORY, projectFactory);
        }
    }

    // ============================================================================
    // EXTENSION MANAGEMENT
    // ============================================================================

    /**
     * @dev Register a new extension
     * @param extensionKey The extension key (use ExtensionKeys library constants)
     * @param extensionAddress The address of the extension contract
     */
    function registerExtension(bytes32 extensionKey, address extensionAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(extensionAddress != address(0), "Invalid extension address");
        require(ExtensionKeys.isValidExtensionKey(extensionKey), "Invalid extension key");
        
        address oldAddress = _extensions[extensionKey];
        _extensions[extensionKey] = extensionAddress;
        
        emit ExtensionRegistered(extensionKey, extensionAddress);
        
        // If registering FounderNFT, grant it the platform role
        if (extensionKey == ExtensionKeys.FOUNDER_NFT) {
            _grantRole(FEE_MANAGER_ROLE, extensionAddress);
        }
    }

    /**
     * @dev Remove an extension
     * @param extensionKey The extension key to remove
     */
    function removeExtension(bytes32 extensionKey) external onlyRole(ADMIN_ROLE) {
        require(_extensions[extensionKey] != address(0), "Extension not registered");
        
        address extensionAddress = _extensions[extensionKey];
        delete _extensions[extensionKey];
        
        emit ExtensionRemoved(extensionKey);
        
        // Revoke roles if needed
        if (extensionKey == ExtensionKeys.FOUNDER_NFT) {
            _revokeRole(FEE_MANAGER_ROLE, extensionAddress);
        }
    }

    /**
     * @dev Get extension address by key
     * @param extensionKey The extension key
     * @return The address of the extension (address(0) if not registered)
     */
    function getExtension(bytes32 extensionKey) external view returns (address) {
        return _extensions[extensionKey];
    }

    /**
     * @dev Check if an extension is registered
     * @param extensionKey The extension key to check
     * @return True if the extension is registered
     */
    function isExtensionRegistered(bytes32 extensionKey) external view returns (bool) {
        return _extensions[extensionKey] != address(0);
    }

    /**
     * @dev Get the FounderNFT extension address
     * @return The FounderNFT contract address
     */
    function getFounderNFT() external view returns (address) {
        return _extensions[ExtensionKeys.FOUNDER_NFT];
    }

    /**
     * @dev Get the ProjectFactory extension address  
     * @return The ProjectFactory contract address
     */
    function getProjectFactory() external view returns (address) {
        return _extensions[ExtensionKeys.PROJECT_FACTORY];
    }

    /**
     * @dev Get all registered extension addresses
     * @return keys Array of extension keys
     * @return addresses Array of corresponding extension addresses
     */
    function getAllExtensions() external view returns (bytes32[] memory keys, address[] memory addresses) {
        bytes32[] memory allKeys = ExtensionKeys.getAllKeys();
        address[] memory allAddresses = new address[](allKeys.length);
        
        for (uint256 i = 0; i < allKeys.length; i++) {
            allAddresses[i] = _extensions[allKeys[i]];
        }
        
        return (allKeys, allAddresses);
    }

    // ============================================================================
    // FACTORY VALIDATION (for Project initialization)
    // ============================================================================

    /**
     * @dev Check if a factory is registered
     * @param factory The factory address to check
     * @return True if the factory is registered
     */
    function isFactoryRegistered(address factory) external view returns (bool) {
        return _extensions[ExtensionKeys.PROJECT_FACTORY] == factory ||
               _extensions[ExtensionKeys.NFT_FACTORY] == factory ||
               _extensions[ExtensionKeys.TOKEN_FACTORY] == factory;
    }

    // ... [Rest of the contract remains the same - project creation, fee distribution, etc.]
    // ... [Include all the existing functions from your current PlatformRegistry]
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}