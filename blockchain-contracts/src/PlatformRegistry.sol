// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Project} from "./Project.sol";

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
        address verificationOracle,
        address[] memory teamMembers
    ) external returns (address);
}

/**
 * @title PlatformRegistryStorage
 * @dev Storage contract for PlatformRegistry to avoid storage collisions during upgrades
 */
contract PlatformRegistryStorage {
    // Platform configuration
    uint256 internal _platformFeePercentage;
    address internal _platformTreasury;
    address internal _verificationOracle;

    // Project tracking
    mapping(address => bool) internal _registeredProjects;
    address[] internal _allProjects;

    // Supported funding tokens
    mapping(address => bool) internal _supportedTokens;

    // Implementation version
    string internal _version;
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

    // Project Factory (can be upgraded separately)
    address public projectFactory;

    // Events
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event PlatformFeeUpdated(uint256 newFee);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);
    event VersionUpdated(string version);

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
    function initialize(
        address initialOwner,
        uint256 initialFee,
        address treasury,
        address oracle,
        address initialFactory
    ) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _platformFeePercentage = initialFee;
        _platformTreasury = treasury;
        _verificationOracle = oracle;
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
            _verificationOracle,
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
     * @dev Updates the verification oracle address
     */
    function updateVerificationOracle(address newOracle) external onlyRole(ADMIN_ROLE) {
        require(newOracle != address(0), "Invalid oracle address");
        _verificationOracle = newOracle;
    }

    /**
     * @dev Adds a supported token
     */
    function addSupportedToken(address token) external onlyRole(ADMIN_ROLE) {
        require(token != address(0), "Invalid token address");
        _supportedTokens[token] = true;
    }

    /**
     * @dev Removes a supported token
     */
    function removeSupportedToken(address token) external onlyRole(ADMIN_ROLE) {
        _supportedTokens[token] = false;
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
     * @dev Returns the verification oracle address
     */
    function verificationOracle() external view returns (address) {
        return _verificationOracle;
    }

    /**
     * @dev Returns if a project is registered
     */
    function isProjectRegistered(address project) external view returns (bool) {
        return _registeredProjects[project];
    }

    /**
     * @dev Returns if a token is supported
     */
    function isSupportedToken(address token) external view returns (bool) {
        return _supportedTokens[token];
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
}
