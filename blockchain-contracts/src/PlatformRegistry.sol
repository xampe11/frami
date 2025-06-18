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
    // Core fee distribution function
    function addPlatformFees(uint256 amount) external;

    // View functions for fee distribution logic
    function getTotalStakedTokens() external view returns (uint256);

    // Optional: Additional view functions that might be useful
    function getCurrentRewardRate() external view returns (uint256);
    function isTokenStaked(uint256 tokenId) external view returns (bool);
    function earned(uint256 tokenId) external view returns (uint256);
}

/**
 * @title PlatformRegistry
 * @dev Main registry contract with enhanced fee distribution
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

    // Extension types
    bytes32 public constant NFT_FACTORY_EXTENSION = keccak256("NFT_FACTORY");
    bytes32 public constant TOKEN_FACTORY_EXTENSION = keccak256("TOKEN_FACTORY");
    bytes32 public constant FOUNDER_NFT_EXTENSION = keccak256("FOUNDER_NFT");

    // Future recipient identifiers
    bytes32 public constant VALIDATOR_RECIPIENT = keccak256("VALIDATOR_RECIPIENT");
    bytes32 public constant COMMUNITY_RECIPIENT = keccak256("COMMUNITY_RECIPIENT");

    // ============================================================================
    // EVENTS
    // ============================================================================

    event PlatformFeeUpdated(uint256 newFee);
    event ProjectCreated(address indexed projectAddress, address indexed creator);
    event ExtensionRegistered(bytes32 indexed extensionType, address indexed extension);
    event ExtensionRemoved(bytes32 indexed extensionType);

    // Fee distribution events
    event FeeDistributionUpdated(uint256 founderPercentage, uint256 treasuryPercentage);
    event FeesDistributed(address indexed project, uint256 totalFee, uint256 founderAmount, uint256 treasuryAmount);
    event PendingFeesDistributed(uint256 amount, address indexed recipient);
    event EmergencyDistributionToggled(bool frozen, address indexed emergencyRecipient);
    event FutureRecipientAdded(bytes32 indexed recipientType, address indexed recipient, uint256 percentage);
    event FutureRecipientRemoved(bytes32 indexed recipientType);

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

        // Register project factory if provided
        if (projectFactory != address(0)) {
            _extensions[NFT_FACTORY_EXTENSION] = projectFactory;
        }

        emit FeeDistributionUpdated(5000, 5000);
    }

    // ============================================================================
    // CORE PLATFORM FUNCTIONS
    // ============================================================================

    /**
     * @dev Creates a new project through the factory
     */
    function createProject(
        address creator,
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 duration,
        bool isFlexibleFunding,
        address[] memory teamMembers
    ) external whenNotPaused returns (address) {
        address factory = _extensions[NFT_FACTORY_EXTENSION];
        require(factory != address(0), "Project factory not set");

        address project = IProjectFactory(factory).createProject(
            creator,
            name,
            description,
            fundingGoal,
            duration,
            isFlexibleFunding,
            _platformFeePercentage,
            _platformTreasury,
            teamMembers
        );

        _registeredProjects[project] = true;
        _allProjects.push(project);

        emit ProjectCreated(project, creator);
        return project;
    }

    // ============================================================================
    // ENHANCED FEE DISTRIBUTION FUNCTIONS
    // ============================================================================

    /**
     * @dev Update fee distribution percentages (must sum to 100%)
     */
    function updateFeeDistribution(uint256 founderPercentage, uint256 treasuryPercentage)
        external
        onlyRole(FEE_MANAGER_ROLE)
    {
        require(founderPercentage + treasuryPercentage == 10000, "Percentages must sum to 10000 (100%)");
        require(founderPercentage <= 10000, "Founder percentage too high");
        require(treasuryPercentage <= 10000, "Treasury percentage too high");

        _feeDistribution =
            FeeDistribution({founderNFTPercentage: founderPercentage, treasuryPercentage: treasuryPercentage});

        emit FeeDistributionUpdated(founderPercentage, treasuryPercentage);
    }

    /**
     * @dev Distribute platform fees to FounderNFT holders and treasury
     */
    function distributePlatformFees(uint256 totalFee) external payable {
        require(_registeredProjects[msg.sender], "Only registered projects");
        require(msg.value == totalFee, "Sent ETH must match total fee");
        require(!_emergencyFreezeDistribution, "Fee distribution frozen");
        require(totalFee > 0, "Fee must be greater than 0");

        // Calculate distribution amounts
        uint256 founderAmount = (totalFee * _feeDistribution.founderNFTPercentage) / 10000;
        uint256 treasuryAmount = totalFee - founderAmount; // Ensures no wei lost to rounding

        // Distribute to FounderNFT holders
        bool founderSuccess = _distributeFounderFees(founderAmount);

        // Always send treasury portion (critical for platform operations)
        _distributeTreasuryFees(treasuryAmount);

        // Update tracking
        _updateFeeTracking(founderAmount, treasuryAmount, founderSuccess);

        emit FeesDistributed(msg.sender, totalFee, founderAmount, treasuryAmount);
    }

    /**
     * @dev Internal function to distribute fees to FounderNFT stakers
     */
    function _distributeFounderFees(uint256 amount) private returns (bool success) {
        if (amount == 0) return true;

        address founderNFTAddress = _extensions[FOUNDER_NFT_EXTENSION];
        if (founderNFTAddress == address(0)) {
            _pendingFounderFees += amount;
            return false;
        }

        // Check if there are staked tokens
        try IFounderNFT(founderNFTAddress).getTotalStakedTokens() returns (uint256 stakedTokens) {
            if (stakedTokens > 0) {
                // Send ETH to FounderNFT contract
                (bool transferSuccess,) = founderNFTAddress.call{value: amount}("");
                if (transferSuccess) {
                    // Notify FounderNFT contract about the new fees
                    try IFounderNFT(founderNFTAddress).addPlatformFees(amount) {
                        _totalFeesReceived[founderNFTAddress] += amount;
                        return true;
                    } catch {
                        // ETH was sent successfully, but notification failed
                        // This is acceptable as FounderNFT will handle the ETH
                        _totalFeesReceived[founderNFTAddress] += amount;
                        return true;
                    }
                } else {
                    _pendingFounderFees += amount;
                    return false;
                }
            } else {
                // No stakers, accumulate for future distribution
                _pendingFounderFees += amount;
                return false;
            }
        } catch {
            _pendingFounderFees += amount;
            return false;
        }
    }

    /**
     * @dev Internal function to distribute fees to treasury
     */
    function _distributeTreasuryFees(uint256 amount) private {
        if (amount == 0) return;

        (bool success,) = _platformTreasury.call{value: amount}("");
        require(success, "Treasury transfer failed");
        _totalFeesReceived[_platformTreasury] += amount;
    }

    /**
     * @dev Update fee tracking for transparency
     */
    function _updateFeeTracking(uint256 founderAmount, uint256 treasuryAmount, bool founderSuccess) private {
        if (founderSuccess) {
            _lastFeeDistribution[_extensions[FOUNDER_NFT_EXTENSION]] = founderAmount;
        }
        _lastFeeDistribution[_platformTreasury] = treasuryAmount;
    }

    // ============================================================================
    // PENDING FEES MANAGEMENT
    // ============================================================================

    /**
     * @dev Distribute accumulated pending FounderNFT fees
     */
    function distributePendingFounderFees() external onlyRole(ADMIN_ROLE) {
        require(_pendingFounderFees > 0, "No pending founder fees");

        uint256 amount = _pendingFounderFees;
        _pendingFounderFees = 0;

        bool success = _distributeFounderFees(amount);
        if (success) {
            emit PendingFeesDistributed(amount, _extensions[FOUNDER_NFT_EXTENSION]);
        } else {
            _pendingFounderFees = amount;
            revert("Pending fee distribution failed");
        }
    }

    /**
     * @dev Emergency withdrawal of pending fees to treasury
     */
    function emergencyWithdrawPendingFees() external onlyRole(ADMIN_ROLE) {
        require(_pendingFounderFees > 0, "No pending fees");

        uint256 amount = _pendingFounderFees;
        _pendingFounderFees = 0;

        (bool success,) = _platformTreasury.call{value: amount}("");
        require(success, "Emergency withdrawal failed");

        emit PendingFeesDistributed(amount, _platformTreasury);
    }

    // ============================================================================
    // EMERGENCY CONTROLS
    // ============================================================================

    /**
     * @dev Emergency freeze/unfreeze fee distribution
     */
    function toggleEmergencyFreeze(bool freeze, address emergencyRecipient) external onlyRole(ADMIN_ROLE) {
        if (freeze) {
            require(emergencyRecipient != address(0), "Emergency recipient required");
            _emergencyFeeRecipient = emergencyRecipient;
        }
        _emergencyFreezeDistribution = freeze;
        emit EmergencyDistributionToggled(freeze, emergencyRecipient);
    }

    // ============================================================================
    // FUTURE EXPANSION FUNCTIONS
    // ============================================================================

    /**
     * @dev Add future recipient for system expansion
     */
    function addFutureRecipient(bytes32 recipientType, address recipient, uint256 percentage)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(recipient != address(0), "Invalid recipient");
        require(percentage <= 10000, "Percentage too high");
        require(_futureRecipients[recipientType] == address(0), "Recipient exists");

        _futureRecipients[recipientType] = recipient;
        _futureRecipientPercentages[recipientType] = percentage;

        emit FutureRecipientAdded(recipientType, recipient, percentage);
    }

    /**
     * @dev Remove future recipient
     */
    function removeFutureRecipient(bytes32 recipientType) external onlyRole(ADMIN_ROLE) {
        require(_futureRecipients[recipientType] != address(0), "Recipient does not exist");

        delete _futureRecipients[recipientType];
        delete _futureRecipientPercentages[recipientType];

        emit FutureRecipientRemoved(recipientType);
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Fee too high"); // max 10%
        _platformFeePercentage = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @dev Update platform treasury address
     */
    function updateTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury");
        _platformTreasury = newTreasury;
    }

    /**
     * @dev Register platform extension
     */
    function registerExtension(bytes32 extensionType, address extensionAddress) external onlyRole(ADMIN_ROLE) {
        require(extensionAddress != address(0), "Invalid extension address");
        _extensions[extensionType] = extensionAddress;
        emit ExtensionRegistered(extensionType, extensionAddress);
    }

    /**
     * @dev Remove platform extension
     */
    function removeExtension(bytes32 extensionType) external onlyRole(ADMIN_ROLE) {
        delete _extensions[extensionType];
        emit ExtensionRemoved(extensionType);
    }

    /**
     * @dev Grant project creator role
     */
    function grantProjectCreatorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PROJECT_CREATOR_ROLE, account);
    }

    /**
     * @dev Pause platform
     */
    function pausePlatform() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause platform
     */
    function unpausePlatform() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @dev Get current fee distribution percentages
     */
    function getFeeDistribution() external view returns (uint256 founderPercentage, uint256 treasuryPercentage) {
        return (_feeDistribution.founderNFTPercentage, _feeDistribution.treasuryPercentage);
    }

    /**
     * @dev Get total fees received by recipient
     */
    function getTotalFeesReceived(address recipient) external view returns (uint256) {
        return _totalFeesReceived[recipient];
    }

    /**
     * @dev Get pending FounderNFT fees
     */
    function getPendingFounderFees() external view returns (uint256) {
        return _pendingFounderFees;
    }

    /**
     * @dev Get last fee distribution for recipient
     */
    function getLastFeeDistribution(address recipient) external view returns (uint256) {
        return _lastFeeDistribution[recipient];
    }

    /**
     * @dev Get fee recipients
     */
    function getFeeRecipients() external view returns (address founderNFT, address treasury) {
        return (_extensions[FOUNDER_NFT_EXTENSION], _platformTreasury);
    }

    /**
     * @dev Get emergency freeze status
     */
    function getEmergencyStatus() external view returns (bool frozen, address emergencyRecipient) {
        return (_emergencyFreezeDistribution, _emergencyFeeRecipient);
    }

    /**
     * @dev Get comprehensive fee stats
     */
    function getFeeStats()
        external
        view
        returns (
            uint256 founderPercentage,
            uint256 treasuryPercentage,
            uint256 totalFounderFees,
            uint256 totalTreasuryFees,
            uint256 pendingFounderFees
        )
    {
        return (
            _feeDistribution.founderNFTPercentage,
            _feeDistribution.treasuryPercentage,
            _totalFeesReceived[_extensions[FOUNDER_NFT_EXTENSION]],
            _totalFeesReceived[_platformTreasury],
            _pendingFounderFees
        );
    }

    /**
     * @dev Standard view functions
     */
    function platformFeePercentage() external view returns (uint256) {
        return _platformFeePercentage;
    }

    function platformTreasury() external view returns (address) {
        return _platformTreasury;
    }

    function isProjectRegistered(address project) external view returns (bool) {
        return _registeredProjects[project];
    }

    function getExtension(bytes32 extensionType) external view returns (address) {
        return _extensions[extensionType];
    }

    function getAllProjects() external view returns (address[] memory) {
        return _allProjects;
    }

    function getProjectCount() external view returns (uint256) {
        return _allProjects.length;
    }

    // ============================================================================
    // UPGRADE FUNCTIONS
    // ============================================================================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Get implementation version
     */
    function version() external view returns (string memory) {
        return _version;
    }
}
