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

/**
 * @title IProjectFactory
 * @dev Interface for the Project Factory
 */
interface IProjectFactory {
    function createProject(
        address creator,
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 duration,
        bool isFlexibleFunding,
        uint256 platformFeePercentage,
        address platformTreasury,
        address[] memory teamMembers
    ) external returns (address);
}

/**
 * @title IFounderNFT
 * @dev Interface for the FounderNFT contract
 */
interface IFounderNFT {
    function addPlatformFees(uint256 amount) external;
    function getPlatformFeeDistributionPercentage() external view returns (uint256);
    function getTotalStakedTokens() external view returns (uint256);
}

/**
 * @title PlatformRegistry
 * @dev Main registry contract with upgrade capabilities and access control
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

    // Extension types
    bytes32 public constant NFT_FACTORY_EXTENSION = keccak256("NFT_FACTORY");
    bytes32 public constant TOKEN_FACTORY_EXTENSION = keccak256("TOKEN_FACTORY");
    bytes32 public constant FOUNDER_NFT_EXTENSION = keccak256("FOUNDER_NFT_EXTENSION");

    // Project Factory (can be upgraded separately)
    address public projectFactory;

    // Events
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event PlatformFeeUpdated(uint256 newFee);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);
    event VersionUpdated(string version);
    event ExtensionRegistered(
        bytes32 indexed extensionType, address indexed extensionAddress, address indexed oldExtensionAddress
    );
    event ExtensionRemoved(bytes32 indexed extensionType, address indexed extensionAddress);
    event FounderFeesRelayed(address indexed project, uint256 amount);

    /**
     * @dev Prevents initialization function from being called twice
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with initial values
     */
    function initialize(address initialOwner, uint256 initialFee, address treasury, address initialFactory)
        external
        initializer
    {
        __Ownable_init(initialOwner);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _platformFeePercentage = initialFee;
        _platformTreasury = treasury;
        projectFactory = initialFactory;
        _version = "1.0.0";

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(PROJECT_CREATOR_ROLE, initialOwner);
    }

    /**
     * @dev Creates a new project through the project factory
     */
    function createProject(
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration,
        bool _isFlexibleFunding,
        address[] memory _teamMembers
    ) external whenNotPaused onlyRole(PROJECT_CREATOR_ROLE) returns (address) {
        // Ensure project factory is set
        require(projectFactory != address(0), "Project factory not set");

        // Create project through factory
        IProjectFactory factory = IProjectFactory(projectFactory);
        address projectAddress = factory.createProject(
            msg.sender,
            _name,
            _description,
            _fundingGoal,
            _duration,
            _isFlexibleFunding,
            _platformFeePercentage,
            _platformTreasury,
            _teamMembers
        );

        // Register project in registry
        _registeredProjects[projectAddress] = true;
        _allProjects.push(projectAddress);

        emit ProjectCreated(projectAddress, msg.sender);
        return projectAddress;
    }

    /**
     * @dev Updates the project factory address
     */
    function updateProjectFactory(address newFactory) external onlyRole(ADMIN_ROLE) {
        require(newFactory != address(0), "Invalid factory address");

        address oldFactory = projectFactory;
        projectFactory = newFactory;

        emit FactoryUpdated(oldFactory, newFactory);
    }

    /**
     * @dev Register an extension
     */
    function registerExtension(bytes32 extensionType, address extensionAddress) external onlyRole(ADMIN_ROLE) {
        require(extensionAddress != address(0), "Invalid extension address");

        address oldExtension = _extensions[extensionType];
        _extensions[extensionType] = extensionAddress;

        emit ExtensionRegistered(extensionType, extensionAddress, oldExtension);
    }

    /**
     * @dev Remove an extension
     */
    function removeExtension(bytes32 extensionType) external onlyRole(ADMIN_ROLE) {
        require(_extensions[extensionType] != address(0), "Extension not registered");

        address oldExtension = _extensions[extensionType];
        delete _extensions[extensionType];

        emit ExtensionRemoved(extensionType, oldExtension);
    }

    /**
     * @dev Get an extension address
     */
    function getExtension(bytes32 extensionType) external view returns (address) {
        return _extensions[extensionType];
    }

    /**
     * @dev Check if an extension is registered
     */
    function isExtensionRegistered(bytes32 extensionType) external view returns (bool) {
        return _extensions[extensionType] != address(0);
    }

    /**
     * @dev Updates the platform fee percentage
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Fee too high"); // max 10%
        _platformFeePercentage = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @dev Updates the platform treasury address
     */
    function updateTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury address");
        _platformTreasury = newTreasury;
    }

    /**
     * @dev Returns if a project is registered
     */
    function isProjectRegistered(address project) external view returns (bool) {
        return _registeredProjects[project];
    }

    /**
     * @dev Relay platform fees to the Founder NFT contract
     * Only callable by registered projects
     */
    function relayFounderFees(uint256 amount) external payable {
        require(_registeredProjects[msg.sender], "Only registered projects can relay fees");

        // Get the founder NFT extension
        address founderNFTAddress = _extensions[FOUNDER_NFT_EXTENSION];
        if (founderNFTAddress == address(0)) {
            return; // No founder NFT extension registered
        }

        // Forward the funds to the founder NFT contract
        (bool success,) = founderNFTAddress.call{value: amount}("");
        if (!success) {
            return; // Silently fail - we don't want to revert the entire transaction
        }

        // Add fees to distribution pool
        try IFounderNFT(founderNFTAddress).addPlatformFees(amount) {
            // Successfully added fees for distribution
            emit FounderFeesRelayed(msg.sender, amount);
        } catch {
            // If call fails, we already sent the ETH, so continue
        }
    }

    /**
     * @dev Pauses the platform
     */
    function pausePlatform() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the platform
     */
    function unpausePlatform() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Grants PROJECT_CREATOR_ROLE to an address
     */
    function grantProjectCreatorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PROJECT_CREATOR_ROLE, account);
    }

    /**
     * @dev Returns the platform fee percentage
     */
    function platformFeePercentage() external view returns (uint256) {
        return _platformFeePercentage;
    }

    /**
     * @dev Returns the platform treasury address
     */
    function platformTreasury() external view returns (address) {
        return _platformTreasury;
    }

    /**
     * @dev Returns if the project factory is registered
     */
    function isFactoryRegistered(address factory) external view returns (bool) {
        return factory == projectFactory;
    }

    /**
     * @dev Returns the number of registered projects
     */
    function getProjectCount() external view returns (uint256) {
        return _allProjects.length;
    }

    /**
     * @dev Returns the address of a project by index
     */
    function getProjectAddress(uint256 index) external view returns (address) {
        require(index < _allProjects.length, "Index out of bounds");
        return _allProjects[index];
    }

    /**
     * @dev Returns the current implementation version
     */
    function getVersion() external view returns (string memory) {
        return _version;
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }

    /**
     * @dev Updates the version string (can be called during upgrade)
     */
    function setVersion(string memory newVersion) external onlyRole(UPGRADER_ROLE) {
        _version = newVersion;
        emit VersionUpdated(newVersion);
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {
        // Allow receiving ETH for relaying
    }
}
