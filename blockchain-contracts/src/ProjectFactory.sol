// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title IProject
 * @dev Interface for Project contracts
 */
interface IProject {
    function initialize(
        address creator,
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 duration,
        bool isFlexibleFunding,
        uint256 platformFeePercentage,
        address platformTreasury,
        address verificationOracle,
        address platformRegistry,
        address[] memory teamMembers
    ) external;
}

/**
 * @title ProjectFactoryStorage
 * @dev Storage contract for ProjectFactory
 */
contract ProjectFactoryStorage {
    // Registry address
    address internal _platformRegistry;

    // Projects created by this factory
    address[] internal _createdProjects;

    // Implementation address for project proxies
    address internal _projectImplementation;
}

/**
 * @title ProjectFactory
 * @dev Factory contract for creating new Project instances
 */
contract ProjectFactory is
    Initializable,
    ProjectFactoryStorage,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Events
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event ProjectImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);

    /**
     * @dev Prevents initialization function from being called twice
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the factory
     */
    function initialize(address initialOwner, address platformRegistry, address projectImplementation)
        external
        initializer
    {
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _platformRegistry = platformRegistry;
        _projectImplementation = projectImplementation;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);

        // Grant the registry permission to call this factory
        _grantRole(DEFAULT_ADMIN_ROLE, platformRegistry);
    }

    /**
     * @dev Creates a new project instance using the stored implementation
     */
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
    ) external returns (address) {
        // Only the platform registry can create projects
        require(msg.sender == _platformRegistry, "Only registry can create projects");
        require(_projectImplementation != address(0), "Project implementation not set");

        // Deploy project proxy pointing to implementation
        bytes memory initData = abi.encodeWithSelector(
            IProject.initialize.selector,
            creator,
            name,
            description,
            fundingGoal,
            duration,
            isFlexibleFunding,
            platformFeePercentage,
            platformTreasury,
            verificationOracle,
            _platformRegistry,
            teamMembers
        );

        address projectAddress = _deployProjectProxy(_projectImplementation, initData);

        // Track created projects
        _createdProjects.push(projectAddress);

        emit ProjectCreated(projectAddress, creator);
        return projectAddress;
    }

    /**
     * @dev Updates the project implementation address
     */
    function updateProjectImplementation(address newImplementation) external onlyRole(ADMIN_ROLE) {
        require(newImplementation != address(0), "Invalid implementation address");

        address oldImplementation = _projectImplementation;
        _projectImplementation = newImplementation;

        emit ProjectImplementationUpdated(oldImplementation, newImplementation);
    }

    /**
     * @dev Returns the platform registry address
     */
    function getPlatformRegistry() external view returns (address) {
        return _platformRegistry;
    }

    /**
     * @dev Returns the current project implementation address
     */
    function getProjectImplementation() external view returns (address) {
        return _projectImplementation;
    }

    /**
     * @dev Returns the number of projects created by this factory
     */
    function getProjectCount() external view returns (uint256) {
        return _createdProjects.length;
    }

    /**
     * @dev Returns a project address by index
     */
    function getProjectAddress(uint256 index) external view returns (address) {
        require(index < _createdProjects.length, "Index out of bounds");
        return _createdProjects[index];
    }

    /**
     * @dev Deploys a minimal proxy contract (EIP-1167) pointing to implementation
     */
    function _deployProjectProxy(address implementation, bytes memory initData) internal returns (address) {
        // Use Create2 for deterministic addresses
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, _createdProjects.length));

        // Create minimal proxy using the Clone pattern
        address instance = _createClone(implementation, salt);

        // Initialize the proxy
        (bool success,) = instance.call(initData);
        require(success, "Project initialization failed");

        return instance;
    }

    /**
     * @dev Creates a clone of the implementation contract
     */
    function _createClone(address implementation, bytes32 salt) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create2(0, ptr, 0x37, salt)
        }
        require(instance != address(0), "Create2 failed");
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }
}
