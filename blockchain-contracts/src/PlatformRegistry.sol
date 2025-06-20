// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title PlatformRegistry
 * @dev Central registry for managing platform extensions, fees, and project tracking
 * @notice This contract serves as the main hub for the crowdfunding platform
 *
 * Key Features:
 * - Dynamic extension system (no hardcoded extension types)
 * - Role-based access control
 * - Fee management and distribution
 * - Project tracking and validation
 * - Upgradeable architecture with UUPS pattern
 */
contract PlatformRegistry is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    // ============================================================================
    // CONSTANTS & ROLES
    // ============================================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");

    // Common extension categories
    bytes32 public constant CATEGORY_FACTORY = keccak256("FACTORY");
    bytes32 public constant CATEGORY_ORACLE = keccak256("ORACLE");
    bytes32 public constant CATEGORY_GOVERNANCE = keccak256("GOVERNANCE");
    bytes32 public constant CATEGORY_TREASURY = keccak256("TREASURY");
    bytes32 public constant CATEGORY_VALIDATOR = keccak256("VALIDATOR");
    bytes32 public constant CATEGORY_TOKEN = keccak256("TOKEN");
    bytes32 public constant CATEGORY_NFT = keccak256("NFT");
    bytes32 public constant CATEGORY_UTILITY = keccak256("UTILITY");

    // Common extension keys (for convenience)
    bytes32 public constant FOUNDER_NFT = keccak256("FOUNDER_NFT");
    bytes32 public constant PROJECT_FACTORY = keccak256("PROJECT_FACTORY");

    // ============================================================================
    // STRUCTS & STORAGE
    // ============================================================================

    struct ExtensionInfo {
        address implementation; // Address of the extension contract
        bytes32 category; // Category of the extension
        bool isActive; // Whether the extension is currently active
        uint256 addedAt; // Block timestamp when extension was added
        string name; // Human-readable name
        string version; // Extension version
        string description; // Extension description
        bytes32[] permissions; // Required permissions for this extension
    }

    struct FeeDistribution {
        uint256 founderNFTPercentage; // Percentage to FounderNFT holders (basis points)
        uint256 treasuryPercentage; // Percentage to platform treasury (basis points)
    }

    // Extension management
    mapping(bytes32 => ExtensionInfo) private _extensions;
    mapping(bytes32 => bytes32[]) private _extensionsByCategory;
    mapping(address => bytes32) private _implementationToKey;
    bytes32[] private _allExtensionKeys;

    // Project tracking
    mapping(address => bool) private _registeredProjects;
    address[] private _allProjects;

    // Fee management
    uint256 private _platformFeePercentage; // Platform fee percentage (basis points)
    address private _platformTreasury; // Platform treasury address
    FeeDistribution private _feeDistribution;

    // Platform info
    string private _version;
    uint256 private _totalProjectsCreated;

    // Reserved storage slots for future upgrades
    uint256[50] private __gap;

    // ============================================================================
    // EVENTS
    // ============================================================================

    // Extension events
    event ExtensionRegistered(
        bytes32 indexed extensionKey,
        address indexed implementation,
        bytes32 indexed category,
        string name,
        string version
    );

    event ExtensionRemoved(bytes32 indexed extensionKey, address indexed implementation);

    event ExtensionDeactivated(bytes32 indexed extensionKey, address indexed implementation);

    event ExtensionActivated(bytes32 indexed extensionKey, address indexed implementation);

    event ExtensionUpgraded(
        bytes32 indexed extensionKey,
        address indexed oldImplementation,
        address indexed newImplementation,
        string newVersion
    );

    // Project events
    event ProjectCreated(address indexed project, address indexed creator);
    event ProjectRegistered(address indexed project);
    event ProjectDeregistered(address indexed project);

    // Fee events
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeDistributionUpdated(uint256 founderPercentage, uint256 treasuryPercentage);
    event FeesDistributed(address indexed project, uint256 totalFee, uint256 founderAmount, uint256 treasuryAmount);

    // ============================================================================
    // MODIFIERS
    // ============================================================================

    modifier onlyActiveExtension(bytes32 extensionKey) {
        require(_extensions[extensionKey].isActive, "Extension not active");
        _;
    }

    modifier validExtensionKey(bytes32 extensionKey) {
        require(extensionKey != bytes32(0), "Invalid extension key");
        _;
    }

    modifier checkExtensionExists(bytes32 extensionKey) {
        require(_extensions[extensionKey].implementation != address(0), "Extension does not exist");
        _;
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /**
     * @dev Initialize the contract
     */
    function initialize(address owner, uint256 initialPlatformFeePercentage, address initialPlatformTreasury)
        public
        initializer
    {
        require(owner != address(0), "Invalid owner");
        require(initialPlatformTreasury != address(0), "Invalid treasury");
        require(initialPlatformFeePercentage <= 1000, "Fee too high"); // max 10%

        __Ownable_init(owner);
        __Pausable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _platformFeePercentage = initialPlatformFeePercentage;
        _platformTreasury = initialPlatformTreasury;
        _version = "2.0.0";

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

        emit FeeDistributionUpdated(5000, 5000);
    }

    // ============================================================================
    // EXTENSION MANAGEMENT
    // ============================================================================

    /**
     * @dev Register a new extension
     * @param extensionKey Unique identifier for the extension
     * @param implementation Address of the extension contract
     * @param category Category of the extension
     * @param name Human-readable name
     * @param version Extension version
     * @param description Extension description
     * @param permissions Required permissions array
     */
    function registerExtension(
        bytes32 extensionKey,
        address implementation,
        bytes32 category,
        string memory name,
        string memory version,
        string memory description,
        bytes32[] memory permissions
    ) external onlyRole(ADMIN_ROLE) validExtensionKey(extensionKey) {
        require(implementation != address(0), "Invalid implementation address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(version).length > 0, "Version cannot be empty");
        require(!_extensions[extensionKey].isActive, "Extension already exists");

        // Check if implementation is already used
        require(_implementationToKey[implementation] == bytes32(0), "Implementation already registered");

        // Store extension info
        _extensions[extensionKey] = ExtensionInfo({
            implementation: implementation,
            category: category,
            isActive: true,
            addedAt: block.timestamp,
            name: name,
            version: version,
            description: description,
            permissions: permissions
        });

        // Add to tracking arrays
        _extensionsByCategory[category].push(extensionKey);
        _allExtensionKeys.push(extensionKey);
        _implementationToKey[implementation] = extensionKey;

        // Handle special extensions
        if (extensionKey == FOUNDER_NFT) {
            _grantRole(FEE_MANAGER_ROLE, implementation);
        }

        emit ExtensionRegistered(extensionKey, implementation, category, name, version);
    }

    /**
     * @dev Upgrade an existing extension to a new implementation
     */
    function upgradeExtension(bytes32 extensionKey, address newImplementation, string memory newVersion)
        external
        onlyRole(ADMIN_ROLE)
        checkExtensionExists(extensionKey)
    {
        require(newImplementation != address(0), "Invalid implementation address");
        require(_implementationToKey[newImplementation] == bytes32(0), "Implementation already registered");

        ExtensionInfo storage extension = _extensions[extensionKey];
        address oldImplementation = extension.implementation;

        // Update implementation tracking
        delete _implementationToKey[oldImplementation];
        _implementationToKey[newImplementation] = extensionKey;

        // Update extension
        extension.implementation = newImplementation;
        extension.version = newVersion;

        // Handle role transfers for special extensions
        if (extensionKey == FOUNDER_NFT) {
            _revokeRole(FEE_MANAGER_ROLE, oldImplementation);
            _grantRole(FEE_MANAGER_ROLE, newImplementation);
        }

        emit ExtensionUpgraded(extensionKey, oldImplementation, newImplementation, newVersion);
    }

    /**
     * @dev Remove an extension completely
     */
    function removeExtension(bytes32 extensionKey) external onlyRole(ADMIN_ROLE) checkExtensionExists(extensionKey) {
        ExtensionInfo memory extension = _extensions[extensionKey];

        // Remove from tracking
        delete _implementationToKey[extension.implementation];
        delete _extensions[extensionKey];
        _removeFromArray(_allExtensionKeys, extensionKey);
        _removeFromCategoryArray(extension.category, extensionKey);

        // Revoke roles if needed
        if (extensionKey == FOUNDER_NFT) {
            _revokeRole(FEE_MANAGER_ROLE, extension.implementation);
        }

        emit ExtensionRemoved(extensionKey, extension.implementation);
    }

    /**
     * @dev Deactivate an extension without removing it
     */
    function deactivateExtension(bytes32 extensionKey)
        external
        onlyRole(ADMIN_ROLE)
        checkExtensionExists(extensionKey)
    {
        ExtensionInfo storage extension = _extensions[extensionKey];
        require(extension.isActive, "Extension already inactive");

        extension.isActive = false;

        // Revoke roles if needed
        if (extensionKey == FOUNDER_NFT) {
            _revokeRole(FEE_MANAGER_ROLE, extension.implementation);
        }

        emit ExtensionDeactivated(extensionKey, extension.implementation);
    }

    /**
     * @dev Reactivate a deactivated extension
     */
    function activateExtension(bytes32 extensionKey) external onlyRole(ADMIN_ROLE) checkExtensionExists(extensionKey) {
        ExtensionInfo storage extension = _extensions[extensionKey];
        require(!extension.isActive, "Extension already active");

        extension.isActive = true;

        // Grant roles if needed
        if (extensionKey == FOUNDER_NFT) {
            _grantRole(FEE_MANAGER_ROLE, extension.implementation);
        }

        emit ExtensionActivated(extensionKey, extension.implementation);
    }

    // ============================================================================
    // EXTENSION QUERIES
    // ============================================================================

    /**
     * @dev Get extension address by key
     */
    function getExtension(bytes32 extensionKey) external view returns (address) {
        return _extensions[extensionKey].implementation;
    }

    /**
     * @dev Get complete extension information
     */
    function getExtensionInfo(bytes32 extensionKey) external view returns (ExtensionInfo memory) {
        return _extensions[extensionKey];
    }

    /**
     * @dev Check if an extension is registered and active
     */
    function isExtensionRegistered(bytes32 extensionKey) external view returns (bool) {
        return _extensions[extensionKey].isActive;
    }

    /**
     * @dev Check if an extension exists (regardless of active status)
     */
    function extensionExists(bytes32 extensionKey) external view returns (bool) {
        return _extensions[extensionKey].implementation != address(0);
    }

    /**
     * @dev Get all registered extensions
     */
    function getAllExtensions() external view returns (bytes32[] memory keys, ExtensionInfo[] memory extensions) {
        uint256 activeCount = 0;

        // Count active extensions
        for (uint256 i = 0; i < _allExtensionKeys.length; i++) {
            if (_extensions[_allExtensionKeys[i]].isActive) {
                activeCount++;
            }
        }

        keys = new bytes32[](activeCount);
        extensions = new ExtensionInfo[](activeCount);

        uint256 index = 0;
        for (uint256 i = 0; i < _allExtensionKeys.length; i++) {
            bytes32 key = _allExtensionKeys[i];
            if (_extensions[key].isActive) {
                keys[index] = key;
                extensions[index] = _extensions[key];
                index++;
            }
        }
    }

    /**
     * @dev Get extensions by category
     */
    function getExtensionsByCategory(bytes32 category)
        external
        view
        returns (bytes32[] memory keys, address[] memory implementations)
    {
        bytes32[] memory categoryKeys = _extensionsByCategory[category];
        uint256 activeCount = 0;

        // Count active extensions in category
        for (uint256 i = 0; i < categoryKeys.length; i++) {
            if (_extensions[categoryKeys[i]].isActive) {
                activeCount++;
            }
        }

        keys = new bytes32[](activeCount);
        implementations = new address[](activeCount);

        uint256 index = 0;
        for (uint256 i = 0; i < categoryKeys.length; i++) {
            bytes32 key = categoryKeys[i];
            if (_extensions[key].isActive) {
                keys[index] = key;
                implementations[index] = _extensions[key].implementation;
                index++;
            }
        }
    }

    /**
     * @dev Get extension key by implementation address
     */
    function getExtensionKey(address implementation) external view returns (bytes32) {
        return _implementationToKey[implementation];
    }

    /**
     * @dev Get total number of extensions
     */
    function getExtensionCount() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _allExtensionKeys.length; i++) {
            if (_extensions[_allExtensionKeys[i]].isActive) {
                activeCount++;
            }
        }
        return activeCount;
    }

    // ============================================================================
    // CONVENIENCE GETTERS (for backward compatibility)
    // ============================================================================

    /**
     * @dev Get the FounderNFT extension address
     */
    function getFounderNFT() external view returns (address) {
        return _extensions[FOUNDER_NFT].implementation;
    }

    /**
     * @dev Get the ProjectFactory extension address
     */
    function getProjectFactory() external view returns (address) {
        return _extensions[PROJECT_FACTORY].implementation;
    }

    // ============================================================================
    // FACTORY VALIDATION
    // ============================================================================

    /**
     * @dev Check if a factory is registered (any factory type)
     */
    function isFactoryRegistered(address factory) public view returns (bool) {
        bytes32 extensionKey = _implementationToKey[factory];
        if (extensionKey == bytes32(0)) return false;

        ExtensionInfo memory extension = _extensions[extensionKey];
        return extension.isActive && extension.category == CATEGORY_FACTORY;
    }

    // ============================================================================
    // PROJECT MANAGEMENT
    // ============================================================================

    /**
     * @dev Register a new project
     */
    function registerProject(address project) external {
        // Check if caller is a registered factory
        require(isFactoryRegistered(msg.sender), "Only registered factories can register projects");
        require(project != address(0), "Invalid project address");
        require(!_registeredProjects[project], "Project already registered");

        _registeredProjects[project] = true;
        _allProjects.push(project);
        _totalProjectsCreated++;

        emit ProjectRegistered(project);
    }

    /**
     * @dev Deregister a project (admin only)
     */
    function deregisterProject(address project) external onlyRole(ADMIN_ROLE) {
        require(_registeredProjects[project], "Project not registered");

        _registeredProjects[project] = false;
        _removeFromProjectArray(project);

        emit ProjectDeregistered(project);
    }

    /**
     * @dev Check if a project is registered
     */
    function isProjectRegistered(address project) external view returns (bool) {
        return _registeredProjects[project];
    }

    /**
     * @dev Get all registered projects
     */
    function getAllProjects() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // Count active projects
        for (uint256 i = 0; i < _allProjects.length; i++) {
            if (_registeredProjects[_allProjects[i]]) {
                activeCount++;
            }
        }

        address[] memory activeProjects = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < _allProjects.length; i++) {
            if (_registeredProjects[_allProjects[i]]) {
                activeProjects[index] = _allProjects[i];
                index++;
            }
        }

        return activeProjects;
    }

    /**
     * @dev Get total projects created
     */
    function getTotalProjectsCreated() external view returns (uint256) {
        return _totalProjectsCreated;
    }

    // ============================================================================
    // FEE MANAGEMENT
    // ============================================================================

    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Fee too high"); // max 10%
        uint256 oldFee = _platformFeePercentage;
        _platformFeePercentage = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Update platform treasury address
     */
    function updatePlatformTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = _platformTreasury;
        _platformTreasury = newTreasury;
        emit PlatformTreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Update fee distribution percentages
     */
    function updateFeeDistribution(uint256 founderPercentage, uint256 treasuryPercentage)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(founderPercentage + treasuryPercentage == 10000, "Percentages must sum to 100%");

        _feeDistribution.founderNFTPercentage = founderPercentage;
        _feeDistribution.treasuryPercentage = treasuryPercentage;

        emit FeeDistributionUpdated(founderPercentage, treasuryPercentage);
    }

    /**
     * @dev Get platform fee percentage
     */
    function getPlatformFeePercentage() external view returns (uint256) {
        return _platformFeePercentage;
    }

    /**
     * @dev Get platform treasury address
     */
    function getPlatformTreasury() external view returns (address) {
        return _platformTreasury;
    }

    /**
     * @dev Get fee distribution info
     */
    function getFeeDistribution() external view returns (FeeDistribution memory) {
        return _feeDistribution;
    }

    // ============================================================================
    // PLATFORM INFO
    // ============================================================================

    /**
     * @dev Get platform version
     */
    function getVersion() external view returns (string memory) {
        return _version;
    }

    /**
     * @dev Update platform version (admin only)
     */
    function updateVersion(string memory newVersion) external onlyRole(ADMIN_ROLE) {
        _version = newVersion;
    }

    // ============================================================================
    // EMERGENCY FUNCTIONS
    // ============================================================================

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============================================================================
    // INTERNAL HELPER FUNCTIONS
    // ============================================================================

    /**
     * @dev Remove an element from an array
     */
    function _removeFromArray(bytes32[] storage array, bytes32 element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @dev Remove an extension from category array
     */
    function _removeFromCategoryArray(bytes32 category, bytes32 extensionKey) internal {
        bytes32[] storage categoryArray = _extensionsByCategory[category];
        for (uint256 i = 0; i < categoryArray.length; i++) {
            if (categoryArray[i] == extensionKey) {
                categoryArray[i] = categoryArray[categoryArray.length - 1];
                categoryArray.pop();
                break;
            }
        }
    }

    /**
     * @dev Remove a project from the projects array
     */
    function _removeFromProjectArray(address project) internal {
        for (uint256 i = 0; i < _allProjects.length; i++) {
            if (_allProjects[i] == project) {
                _allProjects[i] = _allProjects[_allProjects.length - 1];
                _allProjects.pop();
                break;
            }
        }
    }

    // ============================================================================
    // UPGRADE AUTHORIZATION
    // ============================================================================

    /**
     * @dev Authorize contract upgrades (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * @dev Generate extension key from string
     */
    function generateExtensionKey(string memory name) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(name));
    }

    /**
     * @dev Check if extension has specific permission
     */
    function extensionHasPermission(bytes32 extensionKey, bytes32 permission) external view returns (bool) {
        bytes32[] memory permissions = _extensions[extensionKey].permissions;
        for (uint256 i = 0; i < permissions.length; i++) {
            if (permissions[i] == permission) {
                return true;
            }
        }
        return false;
    }
}
