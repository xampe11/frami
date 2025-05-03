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

    function getProjectState() external view returns (uint8);

    function getIsFlexibleFunding() external view returns (bool);
}

/**
 * @title IProjectFactoryRegistry
 * @dev Interface for checking if a factory is registered
 */
interface IProjectFactoryRegistry {
    function isProjectRegistered(address factory) external view returns (bool);
}

/**
 * @title ITokenRegistry
 * @dev Interface for checking if a token is supported
 */
interface ITokenRegistry {
    function isSupportedToken(address token) external view returns (bool);
}

/**
 * @title IERC20
 * @dev Simplified ERC20 interface
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Project contract interface
/**
 * @title TokenInvestmentStorage
 * @dev Storage contract for TokenInvestment
 */
contract TokenInvestmentStorage {
    // Platform registry
    address internal _platformRegistry;

    // Token investments tracking
    // project -> token -> investor -> amount
    mapping(address => mapping(address => mapping(address => uint256))) internal _tokenInvestments;

    // project -> token -> total investment
    mapping(address => mapping(address => uint256)) internal _projectTokenTotals;
}

/**
 * @title TokenInvestment
 * @dev Upgradeable contract for ERC20 token investments
 */
contract TokenInvestment is
    Initializable,
    TokenInvestmentStorage,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Events
    event TokenInvested(address indexed project, address indexed token, address indexed investor, uint256 amount);
    event TokenRefunded(address indexed project, address indexed token, address indexed investor, uint256 amount);

    /**
     * @dev Prevents initialization function from being called twice
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the token investment contract
     */
    function initialize(address initialOwner, address platformRegistry) external initializer {
        __Ownable_init(initialOwner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();

        _platformRegistry = platformRegistry;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
    }

    /**
     * @dev Invest with ERC20 tokens
     */
    function investWithToken(address project, address token, uint256 amount) external nonReentrant {
        // Ensure project is registered
        require(IProjectFactoryRegistry(_platformRegistry).isProjectRegistered(project), "Invalid project");
        require(ITokenRegistry(_platformRegistry).isSupportedToken(token), "Unsupported token");

        // Transfer tokens to this contract
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        // Update investment records
        _tokenInvestments[project][token][msg.sender] += amount;
        _projectTokenTotals[project][token] += amount;

        emit TokenInvested(project, token, msg.sender, amount);
    }

    /**
     * @dev Claim token refund
     */
    function claimTokenRefund(address project, address token) external nonReentrant {
        IProject projectContract = IProject(project);

        // Ensure project has failed and refunds are available
        uint8 state = projectContract.getProjectState();
        require(state == 2 || state == 3, "Refunds not available"); // State.Failed = 2, State.Cancelled = 3

        if (state == 2) {
            // Failed
            require(!projectContract.getIsFlexibleFunding(), "No refunds for flexible funding");
        }

        uint256 refundAmount = _tokenInvestments[project][token][msg.sender];
        require(refundAmount > 0, "No funds to refund");

        // Reset investor's contribution
        _tokenInvestments[project][token][msg.sender] = 0;

        // Return tokens
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.transfer(msg.sender, refundAmount), "Token transfer failed");

        emit TokenRefunded(project, token, msg.sender, refundAmount);
    }

    /**
     * @dev Update platform registry
     */
    function updatePlatformRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "Invalid registry address");
        _platformRegistry = newRegistry;
    }

    /**
     * @dev Get token investment amount
     */
    function getTokenInvestment(address project, address token, address investor) external view returns (uint256) {
        return _tokenInvestments[project][token][investor];
    }

    /**
     * @dev Get total token investment for a project
     */
    function getProjectTokenTotal(address project, address token) external view returns (uint256) {
        return _projectTokenTotals[project][token];
    }

    /**
     * @dev Get platform registry
     */
    function getPlatformRegistry() external view returns (address) {
        return _platformRegistry;
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }
}
