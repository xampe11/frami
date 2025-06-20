// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title IPlatformRegistry
 * @dev Interface for the Platform Registry with dynamic extension support
 */
interface IPlatformRegistry {
    function isFactoryRegistered(address factory) external view returns (bool);
    function isExtensionRegistered(bytes32 extensionKey) external view returns (bool);
    function getExtension(bytes32 extensionKey) external view returns (address);
    function isProjectRegistered(address project) external view returns (bool);
    function getEmergencyStatus() external view returns (bool frozen, address emergencyRecipient);
    function relayFounderFees(uint256 amount) external payable;
}

/**
 * @title IFounderNFT
 * @dev Interface for FounderNFT extension
 */
interface IFounderNFT {
    function getTotalStakedTokens() external view returns (uint256);
    function getPlatformFeeDistributionPercentage() external view returns (uint256);
    function addPlatformFees(uint256 amount) external;
}

/**
 * @title IOracle
 * @dev Interface for Oracle extension
 */
interface IOracle {
    function requestPriceData(address asset) external returns (bytes32 requestId);
    function getLatestPrice(address asset) external view returns (uint256 price, uint256 timestamp);
}

/**
 * @title IValidator
 * @dev Interface for Validator extension
 */
interface IValidator {
    function validateMilestone(address project, uint256 milestoneId, bytes calldata evidence)
        external
        returns (bool approved);
    function isMilestoneValidated(address project, uint256 milestoneId) external view returns (bool);
}

/**
 * @title Project
 * @dev Individual crowdfunding project with milestone-based funding and dynamic extension support
 * @notice This contract represents a single crowdfunding project with enhanced modularity
 */
contract Project is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // ============================================================================
    // CONSTANTS & EXTENSION CATEGORIES
    // ============================================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TEAM_MEMBER_ROLE = keccak256("TEAM_MEMBER_ROLE");

    // Extension categories for common use cases
    bytes32 public constant CATEGORY_FACTORY = keccak256("FACTORY");
    bytes32 public constant CATEGORY_ORACLE = keccak256("ORACLE");
    bytes32 public constant CATEGORY_GOVERNANCE = keccak256("GOVERNANCE");
    bytes32 public constant CATEGORY_TREASURY = keccak256("TREASURY");
    bytes32 public constant CATEGORY_VALIDATOR = keccak256("VALIDATOR");
    bytes32 public constant CATEGORY_TOKEN = keccak256("TOKEN");
    bytes32 public constant CATEGORY_NFT = keccak256("NFT");
    bytes32 public constant CATEGORY_UTILITY = keccak256("UTILITY");

    // ============================================================================
    // ENUMS & STRUCTS
    // ============================================================================

    enum State {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    struct Milestone {
        string title;
        string description;
        uint256 fundingAmount;
        uint256 deadline;
        bool isCompleted;
        bool fundsReleased;
        bytes32 validationRequirement; // Extension key for validation
        bytes validationData;
    }

    struct Investment {
        uint256 amount;
        uint256 timestamp;
        bool isRefunded;
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    // Basic project info
    string private _name;
    string private _description;
    address private _creator;
    uint256 private _fundingGoal;
    uint256 private _deadline;
    bool private _isFlexibleFunding;
    State private _state;

    // Platform integration
    address private _platformRegistry;
    uint256 private _platformFeePercentage;
    address private _platformTreasury;

    // Financial tracking
    uint256 private _totalRaised;
    uint256 private _totalWithdrawn;
    mapping(address => Investment) private _investments;
    address[] private _investors;

    // Milestone system
    Milestone[] private _milestones;
    uint256 private _nextMilestoneToFund;

    // Team management
    mapping(address => bool) private _teamMembers;
    address[] private _teamMembersList;

    // Extension integration
    mapping(bytes32 => bool) private _enabledExtensions;
    mapping(bytes32 => bytes) private _extensionConfig;

    // Reserved storage slots for future upgrades
    uint256[50] private __gap;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event ProjectCreated(address indexed creator, string name, uint256 fundingGoal, uint256 deadline);

    event InvestmentMade(address indexed investor, uint256 amount, uint256 totalRaised);

    event MilestoneAdded(
        uint256 indexed milestoneId, string title, uint256 fundingAmount, bytes32 validationRequirement
    );

    event MilestoneCompleted(uint256 indexed milestoneId, address indexed completedBy);

    event MilestoneFundsReleased(uint256 indexed milestoneId, uint256 amount, address indexed recipient);

    event FundsWithdrawn(address indexed recipient, uint256 amount, uint256 platformFee);

    event RefundIssued(address indexed investor, uint256 amount);

    event ProjectStateChanged(State indexed oldState, State indexed newState);

    event TeamMemberAdded(address indexed member);
    event TeamMemberRemoved(address indexed member);

    event ExtensionEnabled(bytes32 indexed extensionKey, address indexed extensionAddress);

    event ExtensionDisabled(bytes32 indexed extensionKey);

    event ExtensionConfigured(bytes32 indexed extensionKey, bytes configData);

    // ============================================================================
    // MODIFIERS
    // ============================================================================

    modifier onlyActiveFunding() {
        require(_state == State.Active, "Project not active");
        require(block.timestamp < _deadline, "Funding period ended");
        _;
    }

    modifier onlyTeamMember() {
        require(_teamMembers[msg.sender], "Not a team member");
        _;
    }

    modifier extensionEnabled(bytes32 extensionKey) {
        require(_enabledExtensions[extensionKey], "Extension not enabled");
        _;
    }

    modifier validExtension(bytes32 extensionKey) {
        require(
            IPlatformRegistry(_platformRegistry).isExtensionRegistered(extensionKey),
            "Extension not registered in platform"
        );
        _;
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the project with dynamic extension support
     */
    function initialize(
        address creator,
        string memory name,
        string memory description,
        uint256 fundingGoal,
        uint256 duration,
        bool isFlexibleFunding,
        uint256 platformFeePercentage,
        address platformTreasury,
        address platformRegistry,
        address[] memory teamMembers,
        bytes32[] memory enabledExtensions,
        bytes[] memory extensionConfigs
    ) external initializer {
        // Validate factory using dynamic registry check
        require(
            IPlatformRegistry(platformRegistry).isFactoryRegistered(msg.sender),
            "Only registered factories can initialize projects"
        );

        require(creator != address(0), "Invalid creator");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(fundingGoal > 0, "Funding goal must be positive");
        require(duration > 0, "Duration must be positive");
        require(platformFeePercentage <= 1000, "Platform fee too high"); // max 10%

        __Ownable_init(creator);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _name = name;
        _description = description;
        _creator = creator;
        _fundingGoal = fundingGoal;
        _deadline = block.timestamp + duration;
        _isFlexibleFunding = isFlexibleFunding;
        _platformFeePercentage = platformFeePercentage;
        _platformTreasury = platformTreasury;
        _platformRegistry = platformRegistry;
        _state = State.Active;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, creator);
        _grantRole(ADMIN_ROLE, creator);
        _grantRole(UPGRADER_ROLE, creator);
        _grantRole(TEAM_MEMBER_ROLE, creator);

        // Add creator as team member
        _teamMembers[creator] = true;
        _teamMembersList.push(creator);

        // Add additional team members
        for (uint256 i = 0; i < teamMembers.length; i++) {
            if (teamMembers[i] != creator && teamMembers[i] != address(0)) {
                _addTeamMember(teamMembers[i]);
            }
        }

        // Initialize extensions
        require(enabledExtensions.length == extensionConfigs.length, "Extension arrays length mismatch");

        for (uint256 i = 0; i < enabledExtensions.length; i++) {
            _enableExtension(enabledExtensions[i], extensionConfigs[i]);
        }

        emit ProjectCreated(creator, name, fundingGoal, _deadline);
    }

    // ============================================================================
    // EXTENSION MANAGEMENT
    // ============================================================================

    /**
     * @dev Enable an extension for this project
     */
    function enableExtension(bytes32 extensionKey, bytes memory configData)
        external
        onlyRole(ADMIN_ROLE)
        validExtension(extensionKey)
    {
        _enableExtension(extensionKey, configData);
    }

    /**
     * @dev Disable an extension for this project
     */
    function disableExtension(bytes32 extensionKey) external onlyRole(ADMIN_ROLE) {
        require(_enabledExtensions[extensionKey], "Extension not enabled");

        _enabledExtensions[extensionKey] = false;
        delete _extensionConfig[extensionKey];

        emit ExtensionDisabled(extensionKey);
    }

    /**
     * @dev Update extension configuration
     */
    function configureExtension(bytes32 extensionKey, bytes memory configData)
        external
        onlyRole(ADMIN_ROLE)
        extensionEnabled(extensionKey)
    {
        _extensionConfig[extensionKey] = configData;
        emit ExtensionConfigured(extensionKey, configData);
    }

    /**
     * @dev Internal function to enable an extension
     */
    function _enableExtension(bytes32 extensionKey, bytes memory configData) internal {
        require(IPlatformRegistry(_platformRegistry).isExtensionRegistered(extensionKey), "Extension not registered");

        _enabledExtensions[extensionKey] = true;
        _extensionConfig[extensionKey] = configData;

        address extensionAddress = IPlatformRegistry(_platformRegistry).getExtension(extensionKey);
        emit ExtensionEnabled(extensionKey, extensionAddress);
        emit ExtensionConfigured(extensionKey, configData);
    }

    // ============================================================================
    // INVESTMENT FUNCTIONS
    // ============================================================================

    /**
     * @dev Invest in the project
     */
    function invest() external payable onlyActiveFunding nonReentrant {
        require(msg.value > 0, "Investment must be positive");
        require(msg.sender != _creator, "Creator cannot invest");

        // Check emergency status
        (bool frozen,) = IPlatformRegistry(_platformRegistry).getEmergencyStatus();
        require(!frozen, "Platform emergency mode active");

        // Record investment
        if (_investments[msg.sender].amount == 0) {
            _investors.push(msg.sender);
        }

        _investments[msg.sender].amount += msg.value;
        _investments[msg.sender].timestamp = block.timestamp;
        _totalRaised += msg.value;

        emit InvestmentMade(msg.sender, msg.value, _totalRaised);

        // Check if funding goal is reached
        if (_totalRaised >= _fundingGoal) {
            _changeState(State.Successful);
        }
    }

    /**
     * @dev Request refund (for failed or cancelled projects)
     */
    function requestRefund() external nonReentrant {
        require(
            _state == State.Failed || _state == State.Cancelled
                || (!_isFlexibleFunding && _state == State.Active && block.timestamp >= _deadline),
            "Refunds not available"
        );

        Investment storage investment = _investments[msg.sender];
        require(investment.amount > 0, "No investment found");
        require(!investment.isRefunded, "Already refunded");

        uint256 refundAmount = investment.amount;
        investment.isRefunded = true;

        (bool success,) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(msg.sender, refundAmount);
    }

    // ============================================================================
    // MILESTONE MANAGEMENT
    // ============================================================================

    /**
     * @dev Add a new milestone with optional validation requirement
     */
    function addMilestone(
        string memory title,
        string memory description,
        uint256 fundingAmount,
        uint256 deadline,
        bytes32 validationRequirement,
        bytes memory validationData
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(fundingAmount > 0, "Funding amount must be positive");
        require(deadline > block.timestamp, "Deadline must be in future");

        // If validation is required, ensure the extension is available
        if (validationRequirement != bytes32(0)) {
            require(
                IPlatformRegistry(_platformRegistry).isExtensionRegistered(validationRequirement),
                "Validation extension not available"
            );
        }

        _milestones.push(
            Milestone({
                title: title,
                description: description,
                fundingAmount: fundingAmount,
                deadline: deadline,
                isCompleted: false,
                fundsReleased: false,
                validationRequirement: validationRequirement,
                validationData: validationData
            })
        );

        uint256 milestoneId = _milestones.length - 1;
        emit MilestoneAdded(milestoneId, title, fundingAmount, validationRequirement);
    }

    /**
     * @dev Complete a milestone
     */
    function completeMilestone(uint256 milestoneId, bytes memory evidence) external onlyTeamMember {
        require(milestoneId < _milestones.length, "Invalid milestone ID");

        Milestone storage milestone = _milestones[milestoneId];
        require(!milestone.isCompleted, "Milestone already completed");
        require(block.timestamp <= milestone.deadline, "Milestone deadline passed");

        // Handle validation if required
        if (milestone.validationRequirement != bytes32(0)) {
            require(_enabledExtensions[milestone.validationRequirement], "Required validation extension not enabled");

            address validatorAddress =
                IPlatformRegistry(_platformRegistry).getExtension(milestone.validationRequirement);

            bool approved = IValidator(validatorAddress).validateMilestone(address(this), milestoneId, evidence);

            require(approved, "Milestone validation failed");
        }

        milestone.isCompleted = true;
        emit MilestoneCompleted(milestoneId, msg.sender);
    }

    /**
     * @dev Release funds for a completed milestone
     */
    function releaseMilestoneFunds(uint256 milestoneId) external onlyTeamMember nonReentrant {
        require(milestoneId < _milestones.length, "Invalid milestone ID");
        require(milestoneId == _nextMilestoneToFund, "Must release milestones in order");

        Milestone storage milestone = _milestones[milestoneId];
        require(milestone.isCompleted, "Milestone not completed");
        require(!milestone.fundsReleased, "Funds already released");
        require(_state == State.Successful, "Project not successful");

        // Check emergency status
        (bool frozen,) = IPlatformRegistry(_platformRegistry).getEmergencyStatus();
        require(!frozen, "Platform emergency mode active");

        uint256 availableFunds = address(this).balance;
        uint256 releaseAmount = milestone.fundingAmount;

        if (releaseAmount > availableFunds) {
            releaseAmount = availableFunds;
        }

        require(releaseAmount > 0, "No funds available");

        // Calculate platform fee
        uint256 platformFee = (releaseAmount * _platformFeePercentage) / 10000;
        uint256 projectAmount = releaseAmount - platformFee;

        milestone.fundsReleased = true;
        _totalWithdrawn += releaseAmount;
        _nextMilestoneToFund++;

        // Distribute platform fee using dynamic extension system
        if (platformFee > 0) {
            _distributePlatformFee(platformFee);
        }

        // Send project funds to creator
        if (projectAmount > 0) {
            (bool success,) = payable(_creator).call{value: projectAmount}("");
            require(success, "Project funds transfer failed");
        }

        emit MilestoneFundsReleased(milestoneId, projectAmount, _creator);
        emit FundsWithdrawn(_creator, projectAmount, platformFee);
    }

    /**
     * @dev Distribute platform fee using dynamic extension system
     */
    function _distributePlatformFee(uint256 platformFee) internal {
        // Get the FounderNFT extension key dynamically
        bytes32 founderNFTKey = keccak256("FOUNDER_NFT");

        // Check if FounderNFT extension is enabled and has stakers
        if (_enabledExtensions[founderNFTKey]) {
            address founderNFTAddress = IPlatformRegistry(_platformRegistry).getExtension(founderNFTKey);

            if (founderNFTAddress != address(0)) {
                try IFounderNFT(founderNFTAddress).getTotalStakedTokens() returns (uint256 stakedTokens) {
                    if (stakedTokens > 0) {
                        try IFounderNFT(founderNFTAddress).getPlatformFeeDistributionPercentage() returns (
                            uint256 founderPercentage
                        ) {
                            uint256 founderAmount = (platformFee * founderPercentage) / 10000;
                            uint256 treasuryAmount = platformFee - founderAmount;

                            // Send founder portion
                            if (founderAmount > 0) {
                                IPlatformRegistry(_platformRegistry).relayFounderFees{value: founderAmount}(
                                    founderAmount
                                );
                            }

                            // Send treasury portion
                            if (treasuryAmount > 0) {
                                (bool treasurySuccess,) = _platformTreasury.call{value: treasuryAmount}("");
                                require(treasurySuccess, "Treasury transfer failed");
                            }

                            return;
                        } catch {}
                    }
                } catch {}
            }
        }

        // Fallback: send all to treasury
        (bool fallbackSuccess,) = _platformTreasury.call{value: platformFee}("");
        require(fallbackSuccess, "Platform fee transfer failed");
    }

    // ============================================================================
    // PROJECT MANAGEMENT
    // ============================================================================

    /**
     * @dev Withdraw remaining funds (only after project completion or failure)
     */
    function withdrawRemainingFunds() external onlyRole(ADMIN_ROLE) nonReentrant {
        require(
            _state == State.Successful || _state == State.Failed || _state == State.Cancelled,
            "Cannot withdraw during active funding"
        );

        // For successful projects, ensure all milestones are funded
        if (_state == State.Successful) {
            require(_nextMilestoneToFund >= _milestones.length, "Complete milestones first");
        }

        uint256 remainingBalance = address(this).balance;
        require(remainingBalance > 0, "No funds to withdraw");

        if (_state == State.Successful) {
            // Calculate platform fee on remaining funds
            uint256 platformFee = (remainingBalance * _platformFeePercentage) / 10000;
            uint256 projectAmount = remainingBalance - platformFee;

            _totalWithdrawn += remainingBalance;

            // Distribute platform fee
            if (platformFee > 0) {
                _distributePlatformFee(platformFee);
            }

            // Send remaining funds to creator
            if (projectAmount > 0) {
                (bool success,) = payable(_creator).call{value: projectAmount}("");
                require(success, "Withdrawal failed");
            }

            emit FundsWithdrawn(_creator, projectAmount, platformFee);
        } else {
            // For failed/cancelled projects, funds should be available for refunds
            revert("Failed/cancelled projects should process refunds");
        }
    }

    /**
     * @dev Cancel the project (admin only)
     */
    function cancelProject() external onlyRole(ADMIN_ROLE) {
        require(_state == State.Active, "Cannot cancel non-active project");
        _changeState(State.Cancelled);
    }

    /**
     * @dev Internal function to change project state
     */
    function _changeState(State newState) internal {
        State oldState = _state;
        _state = newState;
        emit ProjectStateChanged(oldState, newState);

        // Handle state transitions
        if (newState == State.Failed || newState == State.Cancelled) {
            _pause(); // Pause to prevent new investments
        }
    }

    /**
     * @dev Check and update project state based on deadline
     */
    function updateProjectState() external {
        if (_state == State.Active && block.timestamp >= _deadline) {
            if (_totalRaised >= _fundingGoal || _isFlexibleFunding) {
                _changeState(State.Successful);
            } else {
                _changeState(State.Failed);
            }
        }
    }

    // ============================================================================
    // TEAM MANAGEMENT
    // ============================================================================

    /**
     * @dev Add team member
     */
    function addTeamMember(address member) external onlyRole(ADMIN_ROLE) {
        require(member != address(0), "Invalid member address");
        require(!_teamMembers[member], "Already a team member");

        _addTeamMember(member);
    }

    /**
     * @dev Remove team member
     */
    function removeTeamMember(address member) external onlyRole(ADMIN_ROLE) {
        require(_teamMembers[member], "Not a team member");
        require(member != _creator, "Cannot remove creator");

        _teamMembers[member] = false;
        _revokeRole(TEAM_MEMBER_ROLE, member);

        // Remove from array
        for (uint256 i = 0; i < _teamMembersList.length; i++) {
            if (_teamMembersList[i] == member) {
                _teamMembersList[i] = _teamMembersList[_teamMembersList.length - 1];
                _teamMembersList.pop();
                break;
            }
        }

        emit TeamMemberRemoved(member);
    }

    /**
     * @dev Internal function to add team member
     */
    function _addTeamMember(address member) internal {
        _teamMembers[member] = true;
        _teamMembersList.push(member);
        _grantRole(TEAM_MEMBER_ROLE, member);
        emit TeamMemberAdded(member);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @dev Get basic project info
     */
    function getProjectInfo()
        external
        view
        returns (
            string memory name,
            string memory description,
            address creator,
            uint256 fundingGoal,
            uint256 deadline,
            bool isFlexibleFunding,
            State state
        )
    {
        return (_name, _description, _creator, _fundingGoal, _deadline, _isFlexibleFunding, _state);
    }

    /**
     * @dev Get financial info
     */
    function getFinancialInfo()
        external
        view
        returns (
            uint256 totalRaised,
            uint256 totalWithdrawn,
            uint256 currentBalance,
            uint256 platformFeePercentage,
            uint256 investorCount
        )
    {
        return (_totalRaised, _totalWithdrawn, address(this).balance, _platformFeePercentage, _investors.length);
    }

    /**
     * @dev Get investment info for an address
     */
    function getInvestment(address investor)
        external
        view
        returns (uint256 amount, uint256 timestamp, bool isRefunded)
    {
        Investment memory investment = _investments[investor];
        return (investment.amount, investment.timestamp, investment.isRefunded);
    }

    /**
     * @dev Get milestone info
     */
    function getMilestone(uint256 milestoneId)
        external
        view
        returns (
            string memory title,
            string memory description,
            uint256 fundingAmount,
            uint256 deadline,
            bool isCompleted,
            bool fundsReleased,
            bytes32 validationRequirement
        )
    {
        require(milestoneId < _milestones.length, "Invalid milestone ID");

        Milestone memory milestone = _milestones[milestoneId];
        return (
            milestone.title,
            milestone.description,
            milestone.fundingAmount,
            milestone.deadline,
            milestone.isCompleted,
            milestone.fundsReleased,
            milestone.validationRequirement
        );
    }

    /**
     * @dev Get milestone count
     */
    function getMilestoneCount() external view returns (uint256) {
        return _milestones.length;
    }

    /**
     * @dev Get next milestone to fund
     */
    function getNextMilestoneToFund() external view returns (uint256) {
        return _nextMilestoneToFund;
    }

    /**
     * @dev Get all team members
     */
    function getTeamMembers() external view returns (address[] memory) {
        return _teamMembersList;
    }

    /**
     * @dev Check if address is team member
     */
    function isTeamMember(address account) external view returns (bool) {
        return _teamMembers[account];
    }

    /**
     * @dev Get all investors
     */
    function getInvestors() external view returns (address[] memory) {
        return _investors;
    }

    /**
     * @dev Check if extension is enabled
     */
    function isExtensionEnabled(bytes32 extensionKey) external view returns (bool) {
        return _enabledExtensions[extensionKey];
    }

    /**
     * @dev Get extension configuration
     */
    function getExtensionConfig(bytes32 extensionKey) external view returns (bytes memory) {
        return _extensionConfig[extensionKey];
    }

    /**
     * @dev Get enabled extensions (dynamically generated)
     */
    function getEnabledExtensions() external view returns (bytes32[] memory enabledKeys) {
        // Common extension keys to check
        bytes32[] memory commonKeys = new bytes32[](8);
        commonKeys[0] = keccak256("FOUNDER_NFT");
        commonKeys[1] = keccak256("ORACLE");
        commonKeys[2] = keccak256("VALIDATOR");
        commonKeys[3] = keccak256("TREASURY");
        commonKeys[4] = keccak256("PROJECT_FACTORY");
        commonKeys[5] = keccak256("NFT_FACTORY");
        commonKeys[6] = keccak256("TOKEN_FACTORY");
        commonKeys[7] = keccak256("GOVERNANCE");

        // Count enabled extensions
        uint256 count = 0;
        for (uint256 i = 0; i < commonKeys.length; i++) {
            if (_enabledExtensions[commonKeys[i]]) {
                count++;
            }
        }

        // Build result array
        enabledKeys = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < commonKeys.length; i++) {
            if (_enabledExtensions[commonKeys[i]]) {
                enabledKeys[index] = commonKeys[i];
                index++;
            }
        }
    }

    /**
     * @dev Get platform registry address
     */
    function getPlatformRegistry() external view returns (address) {
        return _platformRegistry;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @dev Pause the project (admin only)
     */
    function pauseProject() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the project (admin only)
     */
    function unpauseProject() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (admin only)
     */
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        (bool frozen, address emergencyRecipient) = IPlatformRegistry(_platformRegistry).getEmergencyStatus();
        require(frozen, "No emergency declared");
        require(emergencyRecipient != address(0), "No emergency recipient set");

        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success,) = payable(emergencyRecipient).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // ============================================================================
    // UPGRADE AUTHORIZATION
    // ============================================================================

    /**
     * @dev Authorize contract upgrades (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // ============================================================================
    // RECEIVE & FALLBACK
    // ============================================================================

    /**
     * @dev Accept ETH deposits
     */
    receive() external payable {
        // Allow ETH deposits even when paused (for refunds, etc.)
        if (_state == State.Active && !paused()) {
            // Treat as investment if project is active and not paused
            require(msg.sender != _creator, "Creator cannot invest via receive");
            require(block.timestamp < _deadline, "Funding period ended");

            // Record investment
            if (_investments[msg.sender].amount == 0) {
                _investors.push(msg.sender);
            }

            _investments[msg.sender].amount += msg.value;
            _investments[msg.sender].timestamp = block.timestamp;
            _totalRaised += msg.value;

            emit InvestmentMade(msg.sender, msg.value, _totalRaised);

            // Check if funding goal is reached
            if (_totalRaised >= _fundingGoal) {
                _changeState(State.Successful);
            }
        }
        // Otherwise just accept the ETH (for platform fee distributions, etc.)
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }

    // ============================================================================
    // EXTENSION INTEGRATION HELPERS
    // ============================================================================

    /**
     * @dev Call extension function with data
     */
    function callExtension(bytes32 extensionKey, bytes memory data)
        external
        onlyRole(ADMIN_ROLE)
        extensionEnabled(extensionKey)
        returns (bytes memory)
    {
        address extensionAddress = IPlatformRegistry(_platformRegistry).getExtension(extensionKey);
        require(extensionAddress != address(0), "Extension address not found");

        (bool success, bytes memory result) = extensionAddress.call(data);
        require(success, "Extension call failed");

        return result;
    }

    /**
     * @dev Check if project can use a specific extension
     */
    function canUseExtension(bytes32 extensionKey) external view returns (bool) {
        return
            _enabledExtensions[extensionKey] && IPlatformRegistry(_platformRegistry).isExtensionRegistered(extensionKey);
    }

    /**
     * @dev Get extension address if enabled
     */
    function getEnabledExtensionAddress(bytes32 extensionKey) external view returns (address) {
        if (!_enabledExtensions[extensionKey]) {
            return address(0);
        }
        return IPlatformRegistry(_platformRegistry).getExtension(extensionKey);
    }

    // ============================================================================
    // ORACLE INTEGRATION (Example Extension Usage)
    // ============================================================================

    /**
     * @dev Request price data from Oracle extension (if enabled)
     */
    function requestPriceData(address asset) external onlyTeamMember returns (bytes32) {
        bytes32 oracleKey = keccak256("ORACLE");
        require(_enabledExtensions[oracleKey], "Oracle extension not enabled");

        address oracleAddress = IPlatformRegistry(_platformRegistry).getExtension(oracleKey);
        return IOracle(oracleAddress).requestPriceData(asset);
    }

    /**
     * @dev Get latest price from Oracle extension (if enabled)
     */
    function getLatestPrice(address asset) external view returns (uint256 price, uint256 timestamp) {
        bytes32 oracleKey = keccak256("ORACLE");
        require(_enabledExtensions[oracleKey], "Oracle extension not enabled");

        address oracleAddress = IPlatformRegistry(_platformRegistry).getExtension(oracleKey);
        return IOracle(oracleAddress).getLatestPrice(asset);
    }

    // ============================================================================
    // VALIDATION INTEGRATION (Example Extension Usage)
    // ============================================================================

    /**
     * @dev Check if milestone is validated by external validator
     */
    function isMilestoneValidated(uint256 milestoneId) external view returns (bool) {
        require(milestoneId < _milestones.length, "Invalid milestone ID");

        Milestone memory milestone = _milestones[milestoneId];
        if (milestone.validationRequirement == bytes32(0)) {
            return milestone.isCompleted; // No external validation required
        }

        if (!_enabledExtensions[milestone.validationRequirement]) {
            return false; // Required validation extension not enabled
        }

        address validatorAddress = IPlatformRegistry(_platformRegistry).getExtension(milestone.validationRequirement);
        if (validatorAddress == address(0)) {
            return false; // Validator not found
        }

        return IValidator(validatorAddress).isMilestoneValidated(address(this), milestoneId);
    }

    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================

    /**
     * @dev Process multiple refunds in batch (gas efficient)
     */
    function batchRefund(address[] memory investors) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(_state == State.Failed || _state == State.Cancelled, "Refunds not available");

        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            Investment storage investment = _investments[investor];

            if (investment.amount > 0 && !investment.isRefunded) {
                uint256 refundAmount = investment.amount;
                investment.isRefunded = true;

                (bool success,) = payable(investor).call{value: refundAmount}("");
                if (success) {
                    emit RefundIssued(investor, refundAmount);
                } else {
                    // Revert the refund status if transfer failed
                    investment.isRefunded = false;
                }
            }
        }
    }

    /**
     * @dev Enable multiple extensions in batch
     */
    function batchEnableExtensions(bytes32[] memory extensionKeys, bytes[] memory configData)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(extensionKeys.length == configData.length, "Array length mismatch");

        for (uint256 i = 0; i < extensionKeys.length; i++) {
            if (IPlatformRegistry(_platformRegistry).isExtensionRegistered(extensionKeys[i])) {
                _enableExtension(extensionKeys[i], configData[i]);
            }
        }
    }

    // ============================================================================
    // ANALYTICS & REPORTING
    // ============================================================================

    /**
     * @dev Get comprehensive project analytics
     */
    function getProjectAnalytics()
        external
        view
        returns (
            uint256 totalRaised,
            uint256 totalWithdrawn,
            uint256 currentBalance,
            uint256 investorCount,
            uint256 milestoneCount,
            uint256 completedMilestones,
            uint256 fundedMilestones,
            uint256 daysRemaining,
            uint256 fundingProgress // percentage in basis points
        )
    {
        // Calculate completed and funded milestones
        uint256 completed = 0;
        uint256 funded = 0;
        for (uint256 i = 0; i < _milestones.length; i++) {
            if (_milestones[i].isCompleted) completed++;
            if (_milestones[i].fundsReleased) funded++;
        }

        // Calculate days remaining
        uint256 remaining = 0;
        if (block.timestamp < _deadline) {
            remaining = (_deadline - block.timestamp) / 86400; // Convert to days
        }

        // Calculate funding progress (in basis points for precision)
        uint256 progress = 0;
        if (_fundingGoal > 0) {
            progress = (_totalRaised * 10000) / _fundingGoal;
            if (progress > 10000) progress = 10000; // Cap at 100%
        }

        return (
            _totalRaised,
            _totalWithdrawn,
            address(this).balance,
            _investors.length,
            _milestones.length,
            completed,
            funded,
            remaining,
            progress
        );
    }

    /**
     * @dev Get milestone funding summary
     */
    function getMilestoneFundingSummary()
        external
        view
        returns (
            uint256 totalMilestoneAmount,
            uint256 completedMilestoneAmount,
            uint256 releasedMilestoneAmount,
            uint256 pendingMilestoneAmount
        )
    {
        for (uint256 i = 0; i < _milestones.length; i++) {
            Milestone memory milestone = _milestones[i];
            totalMilestoneAmount += milestone.fundingAmount;

            if (milestone.isCompleted) {
                completedMilestoneAmount += milestone.fundingAmount;
            }

            if (milestone.fundsReleased) {
                releasedMilestoneAmount += milestone.fundingAmount;
            } else if (milestone.isCompleted) {
                pendingMilestoneAmount += milestone.fundingAmount;
            }
        }
    }

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * @dev Calculate platform fee for a given amount
     */
    function calculatePlatformFee(uint256 amount) external view returns (uint256) {
        return (amount * _platformFeePercentage) / 10000;
    }

    /**
     * @dev Check if project funding period is active
     */
    function isFundingActive() external view returns (bool) {
        return _state == State.Active && block.timestamp < _deadline && !paused();
    }

    /**
     * @dev Check if project is successful
     */
    function isSuccessful() external view returns (bool) {
        return _state == State.Successful || (_state == State.Active && _totalRaised >= _fundingGoal);
    }

    /**
     * @dev Get time until deadline
     */
    function getTimeUntilDeadline() external view returns (uint256) {
        if (block.timestamp >= _deadline) {
            return 0;
        }
        return _deadline - block.timestamp;
    }

    /**
     * @dev Get funding progress percentage (in basis points)
     */
    function getFundingProgress() external view returns (uint256) {
        if (_fundingGoal == 0) return 0;
        uint256 progress = (_totalRaised * 10000) / _fundingGoal;
        return progress > 10000 ? 10000 : progress;
    }

    /**
     * @dev Check if refunds are available
     */
    function areRefundsAvailable() external view returns (bool) {
        return _state == State.Failed || _state == State.Cancelled
            || (!_isFlexibleFunding && _state == State.Active && block.timestamp >= _deadline);
    }

    // ============================================================================
    // EVENTS FOR EXTENSION INTEGRATION
    // ============================================================================

    /**
     * @dev Emit custom event for extension tracking
     */
    function emitExtensionEvent(bytes32 eventType, bytes memory eventData) external onlyRole(ADMIN_ROLE) {
        // Custom event emission for extension integration
        // Extensions can listen to these events for their own logic
        emit ExtensionConfigured(eventType, eventData);
    }

    // ============================================================================
    // HELPER FUNCTIONS FOR DYNAMIC EXTENSION KEYS
    // ============================================================================

    /**
     * @dev Generate extension key from string (utility function)
     */
    function generateExtensionKey(string memory extensionName) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(extensionName));
    }

    /**
     * @dev Check if extension exists in platform registry
     */
    function extensionExistsInRegistry(bytes32 extensionKey) external view returns (bool) {
        return IPlatformRegistry(_platformRegistry).isExtensionRegistered(extensionKey);
    }

    /**
     * @dev Get extension address from platform registry
     */
    function getExtensionFromRegistry(bytes32 extensionKey) external view returns (address) {
        return IPlatformRegistry(_platformRegistry).getExtension(extensionKey);
    }

    // ============================================================================
    // VERSIONING & METADATA
    // ============================================================================

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "2.0.0-dynamic";
    }

    /**
     * @dev Get contract type identifier
     */
    function contractType() external pure returns (bytes32) {
        return keccak256("PROJECT_CONTRACT");
    }

    /**
     * @dev Get supported extension categories
     */
    function getSupportedExtensionCategories() external pure returns (bytes32[] memory) {
        bytes32[] memory categories = new bytes32[](8);
        categories[0] = CATEGORY_FACTORY;
        categories[1] = CATEGORY_ORACLE;
        categories[2] = CATEGORY_GOVERNANCE;
        categories[3] = CATEGORY_TREASURY;
        categories[4] = CATEGORY_VALIDATOR;
        categories[5] = CATEGORY_TOKEN;
        categories[6] = CATEGORY_NFT;
        categories[7] = CATEGORY_UTILITY;
        return categories;
    }
}
