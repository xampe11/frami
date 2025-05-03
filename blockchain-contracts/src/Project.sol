// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
/**
 * @title IVerificationOracle
 * @dev Interface for the verification oracle
 */

interface IVerificationOracle {
    function verifyMilestone(address project, uint256 milestoneId) external view returns (bool);
}

/**
 * @title IProjectFactoryRegistry
 * @dev Interface for checking if a factory is registered
 */
interface IProjectFactoryRegistry {
    function isFactoryRegistered(address factory) external view returns (bool);
}
/**
 * @title ProjectStorage
 * @dev Storage contract for Project
 */

contract ProjectStorage {
    // Project configuration
    string internal _name;
    string internal _description;
    address internal _creator;
    uint256 internal _fundingGoal;
    uint256 internal _deadline;
    bool internal _isFlexibleFunding;
    uint256 internal _platformFeePercentage;
    address internal _platformTreasury;
    address internal _platformRegistry;
    address internal _verificationOracle;

    // Project state
    enum State {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    State internal _state;

    uint256 internal _totalFundsRaised;
    uint256 internal _totalFundsWithdrawn;
    uint256 internal _totalInvestors;

    // Milestone tracking
    struct Milestone {
        string description;
        uint256 fundingPercentage;
        bool completed;
        bool fundsReleased;
        uint256 votesNeeded;
        uint256 votesReceived;
        mapping(address => bool) investorVoted;
    }

    uint256 internal _milestoneCount;
    mapping(uint256 => Milestone) internal _milestones;

    // Team members
    mapping(address => bool) internal _teamMembers;

    // Investor tracking
    mapping(address => uint256) internal _investments;
    address[] internal _investors;
}

/**
 * @title Project
 * @dev Upgradeable project contract for fundraising
 */
contract Project is
    Initializable,
    ProjectStorage,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TEAM_MEMBER_ROLE = keccak256("TEAM_MEMBER_ROLE");

    // Events
    event FundingReceived(address indexed investor, uint256 amount);
    event MilestoneCreated(uint256 indexed milestoneId, string description, uint256 fundingPercentage);
    event MilestoneCompleted(uint256 indexed milestoneId);
    event MilestoneVoteReceived(uint256 indexed milestoneId, address indexed investor);
    event FundsWithdrawn(uint256 amount, address recipient);
    event ProjectStateChanged(State newState);
    event RefundIssued(address indexed investor, uint256 amount);
    event TeamMemberAdded(address indexed member);
    event TeamMemberRemoved(address indexed member);

    /**
     * @dev Prevents initialization function from being called twice
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the project
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
        address verificationOracle,
        address platformRegistry,
        address[] memory teamMembers
    ) external initializer {
        // Only allow initialization from a factory deployed by the registry
        // This validation ensures only legitimate factory contracts can create projects
        require(
            IProjectFactoryRegistry(platformRegistry).isFactoryRegistered(msg.sender),
            "Only registered factories can initialize projects"
        );

        __Ownable_init(creator);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _name = name;
        _description = description;
        _creator = creator;
        _fundingGoal = fundingGoal;
        _deadline = block.timestamp + duration;
        _isFlexibleFunding = isFlexibleFunding;
        _platformFeePercentage = platformFeePercentage;
        _platformTreasury = platformTreasury;
        _verificationOracle = verificationOracle;
        _platformRegistry = platformRegistry;
        _state = State.Active;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, creator);
        _grantRole(ADMIN_ROLE, creator);
        _grantRole(UPGRADER_ROLE, creator);
        _grantRole(TEAM_MEMBER_ROLE, creator);

        // Add creator as team member
        _teamMembers[creator] = true;

        // Add additional team members
        for (uint256 i = 0; i < teamMembers.length; i++) {
            if (teamMembers[i] != creator) {
                _teamMembers[teamMembers[i]] = true;
                _grantRole(TEAM_MEMBER_ROLE, teamMembers[i]);
                emit TeamMemberAdded(teamMembers[i]);
            }
        }
    }

    /**
     * @dev Modifier for active funding state
     */
    modifier onlyActiveFunding() {
        require(_state == State.Active, "Project not active");
        require(block.timestamp < _deadline, "Funding period ended");
        _;
    }

    /**
     * @dev Modifier for after deadline
     */
    modifier onlyAfterDeadline() {
        require(block.timestamp >= _deadline, "Funding period not ended");
        _;
    }

    /**
     * @dev Modifier for investors
     */
    modifier onlyInvestor() {
        require(_investments[msg.sender] > 0, "Not an investor");
        _;
    }

    /**
     * @dev Invest in project with native token (ETH)
     */
    function invest() external payable onlyActiveFunding nonReentrant {
        require(msg.value > 0, "Investment must be greater than 0");

        // Update investment records
        if (_investments[msg.sender] == 0) {
            _investors.push(msg.sender);
            _totalInvestors++;
        }

        _investments[msg.sender] += msg.value;
        _totalFundsRaised += msg.value;

        emit FundingReceived(msg.sender, msg.value);
    }

    /**
     * @dev Create a new milestone
     */
    function createMilestone(string memory description, uint256 fundingPercentage)
        external
        onlyRole(TEAM_MEMBER_ROLE)
    {
        require(fundingPercentage > 0 && fundingPercentage <= 10000, "Invalid percentage");

        uint256 milestoneId = _milestoneCount;
        Milestone storage newMilestone = _milestones[milestoneId];

        newMilestone.description = description;
        newMilestone.fundingPercentage = fundingPercentage;
        newMilestone.completed = false;
        newMilestone.fundsReleased = false;
        // Require 51% of investors by investment amount to approve
        newMilestone.votesNeeded = (_totalInvestors * 51) / 100;

        _milestoneCount++;

        emit MilestoneCreated(milestoneId, description, fundingPercentage);
    }

    /**
     * @dev Submit milestone completion for verification
     */
    function submitMilestoneCompletion(uint256 milestoneId) external onlyRole(TEAM_MEMBER_ROLE) {
        require(milestoneId < _milestoneCount, "Invalid milestone");
        require(!_milestones[milestoneId].completed, "Already completed");
        require(_state == State.Successful, "Project not successful");

        bool verified = IVerificationOracle(_verificationOracle).verifyMilestone(address(this), milestoneId);
        require(verified, "Milestone verification failed");

        _milestones[milestoneId].completed = true;

        emit MilestoneCompleted(milestoneId);
    }

    /**
     * @dev Vote for milestone completion
     */
    function voteMilestone(uint256 milestoneId) external onlyInvestor {
        require(milestoneId < _milestoneCount, "Invalid milestone");
        require(_milestones[milestoneId].completed, "Milestone not completed");
        require(!_milestones[milestoneId].investorVoted[msg.sender], "Already voted");

        _milestones[milestoneId].investorVoted[msg.sender] = true;
        _milestones[milestoneId].votesReceived++;

        emit MilestoneVoteReceived(milestoneId, msg.sender);
    }

    /**
     * @dev Release funds for completed milestone
     */
    function releaseMilestoneFunds(uint256 milestoneId) external onlyRole(TEAM_MEMBER_ROLE) nonReentrant {
        require(milestoneId < _milestoneCount, "Invalid milestone");
        require(_milestones[milestoneId].completed, "Milestone not completed");
        require(!_milestones[milestoneId].fundsReleased, "Funds already released");
        require(_state == State.Successful, "Project not successful");
        require(_milestones[milestoneId].votesReceived >= _milestones[milestoneId].votesNeeded, "Not enough votes");

        _milestones[milestoneId].fundsReleased = true;

        // Calculate funds to release based on percentage
        uint256 releaseAmount = (_totalFundsRaised * _milestones[milestoneId].fundingPercentage) / 10000;
        uint256 platformFee = (releaseAmount * _platformFeePercentage) / 10000;
        uint256 creatorAmount = releaseAmount - platformFee;

        // Update withdrawn funds
        _totalFundsWithdrawn += releaseAmount;

        // Send platform fee
        (bool feeSuccess,) = _platformTreasury.call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");

        // Send funds to creator
        (bool success,) = _creator.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(releaseAmount, _creator);
    }

    /**
     * @dev Check and update project state
     */
    function checkAndUpdateState() public onlyAfterDeadline returns (State) {
        if (_state != State.Active) {
            return _state;
        }

        if (_totalFundsRaised >= _fundingGoal) {
            _state = State.Successful;
        } else {
            if (_isFlexibleFunding) {
                _state = State.Successful; // Flexible funding allows any amount
            } else {
                _state = State.Failed; // All-or-nothing requires meeting goal
            }
        }

        emit ProjectStateChanged(_state);
        return _state;
    }

    /**
     * @dev Claim refund if project failed
     */
    function claimRefund() external onlyInvestor nonReentrant {
        require(_state == State.Failed || _state == State.Cancelled, "Refunds not available");
        if (_state == State.Failed) {
            require(!_isFlexibleFunding, "No refunds for flexible funding");
        }

        uint256 refundAmount = _investments[msg.sender];
        require(refundAmount > 0, "No funds to refund");

        // Reset investor's contribution
        _investments[msg.sender] = 0;

        // Send refund
        (bool success,) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit RefundIssued(msg.sender, refundAmount);
    }

    /**
     * @dev Cancel project (only possible before deadline)
     */
    function cancelProject() external onlyRole(ADMIN_ROLE) {
        require(_state == State.Active, "Cannot cancel non-active project");

        _state = State.Cancelled;
        emit ProjectStateChanged(State.Cancelled);
    }

    /**
     * @dev Add team member
     */
    function addTeamMember(address member) external onlyRole(ADMIN_ROLE) {
        require(member != address(0), "Invalid address");
        require(!_teamMembers[member], "Already a team member");

        _teamMembers[member] = true;
        _grantRole(TEAM_MEMBER_ROLE, member);

        emit TeamMemberAdded(member);
    }

    /**
     * @dev Remove team member
     */
    function removeTeamMember(address member) external onlyRole(ADMIN_ROLE) {
        require(member != _creator, "Cannot remove creator");
        require(member != owner(), "Cannot remove owner");
        require(_teamMembers[member], "Not a team member");

        _teamMembers[member] = false;
        _revokeRole(TEAM_MEMBER_ROLE, member);

        emit TeamMemberRemoved(member);
    }

    /**
     * @dev Get project details
     */
    function getProjectDetails()
        external
        view
        returns (
            string memory name,
            string memory description,
            address creator,
            uint256 fundingGoal,
            uint256 deadline,
            uint256 totalFundsRaised,
            State state,
            bool isFlexibleFunding
        )
    {
        return (_name, _description, _creator, _fundingGoal, _deadline, _totalFundsRaised, _state, _isFlexibleFunding);
    }

    /**
     * @dev Get project state
     */
    function getProjectState() external view returns (State state) {
        return (_state);
    }

    function getIsFlexibleFunding() external view returns (bool isFlexibleFunding) {
        return (_isFlexibleFunding);
    }

    /**
     * @dev Get milestone details
     */
    function getMilestoneDetails(uint256 milestoneId)
        external
        view
        returns (
            string memory description,
            uint256 fundingPercentage,
            bool completed,
            bool fundsReleased,
            uint256 votesNeeded,
            uint256 votesReceived
        )
    {
        require(milestoneId < _milestoneCount, "Invalid milestone ID");

        Milestone storage milestone = _milestones[milestoneId];
        return (
            milestone.description,
            milestone.fundingPercentage,
            milestone.completed,
            milestone.fundsReleased,
            milestone.votesNeeded,
            milestone.votesReceived
        );
    }

    /**
     * @dev Get investor details
     */
    function getInvestmentAmount(address investor) external view returns (uint256) {
        return _investments[investor];
    }

    /**
     * @dev Get investor count
     */
    function getInvestorCount() external view returns (uint256) {
        return _totalInvestors;
    }

    /**
     * @dev Check if address is team member
     */
    function isTeamMember(address member) external view returns (bool) {
        return _teamMembers[member];
    }

    /**
     * @dev Get milestone count
     */
    function getMilestoneCount() external view returns (uint256) {
        return _milestoneCount;
    }

    /**
     * @dev Check if investor has voted on milestone
     */
    function hasInvestorVoted(uint256 milestoneId, address investor) external view returns (bool) {
        require(milestoneId < _milestoneCount, "Invalid milestone ID");
        return _milestones[milestoneId].investorVoted[investor];
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Only allow direct ETH transfers during active funding
        require(_state == State.Active, "Project not active");
        require(block.timestamp < _deadline, "Funding period ended");

        // Process as investment
        if (_investments[msg.sender] == 0) {
            _investors.push(msg.sender);
            _totalInvestors++;
        }

        _investments[msg.sender] += msg.value;
        _totalFundsRaised += msg.value;

        emit FundingReceived(msg.sender, msg.value);
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }
}
