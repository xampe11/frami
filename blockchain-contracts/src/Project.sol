// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ProjectStorage} from "./ProjectStorage.sol";
import {ExtensionKeys} from "./ExtensionKeys.sol";

/**
 * @title IFounderNFT
 * @dev Interface for the FounderNFT contract
 */
interface IFounderNFT {
    function getPlatformFeeDistributionPercentage() external view returns (uint256);
    function getTotalStakedTokens() external view returns (uint256);
    function addPlatformFees(uint256 amount) external;
}

/**
 * @title IPlatformRegistry
 * @dev Interface for the PlatformRegistry with extension registry and relay functionality
 */
interface IPlatformRegistry {
    function getExtension(bytes32 extensionType) external view returns (address);
    function relayFounderFees(uint256 amount) external payable;
    function isProjectRegistered(address project) external view returns (bool);
    function getEmergencyStatus() external view returns (bool frozen, address emergencyRecipient);
    function isFactoryRegistered(address factory) external view returns (bool);
}

/**
 * @title Project
 * @dev Upgradeable project contract for fundraising with standardized extension integration
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
        address platformRegistry,
        address[] memory teamMembers
    ) external initializer {
        // Validate factory using standardized check
        require(
            IPlatformRegistry(platformRegistry).isFactoryRegistered(msg.sender),
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

    // ============================================================================
    // MODIFIERS
    // ============================================================================

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

    // ============================================================================
    // FUNDING FUNCTIONS
    // ============================================================================

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

    // ============================================================================
    // MILESTONE FUNCTIONS
    // ============================================================================

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
     * @dev Release funds for completed milestone with enhanced fee distribution
     */
    function releaseMilestoneFunds(uint256 milestoneId) external onlyRole(TEAM_MEMBER_ROLE) nonReentrant {
        require(milestoneId < _milestoneCount, "Invalid milestone");
        require(_milestones[milestoneId].completed, "Milestone not completed");
        require(!_milestones[milestoneId].fundsReleased, "Funds already released");
        require(_state == State.Successful, "Project not successful");
        require(_milestones[milestoneId].votesReceived >= _milestones[milestoneId].votesNeeded, "Not enough votes");

        // CHECK 1: Emergency freeze validation
        (bool frozen,) = IPlatformRegistry(_platformRegistry).getEmergencyStatus();
        require(!frozen, "Fee distribution frozen");

        _milestones[milestoneId].fundsReleased = true;

        // Calculate funds to release based on percentage
        uint256 releaseAmount = (_totalFundsRaised * _milestones[milestoneId].fundingPercentage) / 10000;
        uint256 platformFee = (releaseAmount * _platformFeePercentage) / 10000;

        // CHECK 2: Get FounderNFT extension using standardized key
        address foundersNFTAddress = IPlatformRegistry(_platformRegistry).getExtension(ExtensionKeys.FOUNDER_NFT);

        uint256 founderShare = 0;
        uint256 treasuryAmount = platformFee;

        // Enhanced fee distribution logic
        if (foundersNFTAddress != address(0)) {
            // FounderNFT is registered, attempt to distribute fees
            try IFounderNFT(foundersNFTAddress).getPlatformFeeDistributionPercentage() returns (
                uint256 founderPercentage
            ) {
                // Calculate founder share
                founderShare = (platformFee * founderPercentage) / 10000;

                if (founderShare > 0) {
                    // Check if there are staked tokens
                    try IFounderNFT(foundersNFTAddress).getTotalStakedTokens() returns (uint256 stakedTokens) {
                        if (stakedTokens > 0) {
                            // Use the registry's relay function to send fees to FounderNFT
                            treasuryAmount = platformFee - founderShare;

                            try IPlatformRegistry(_platformRegistry).relayFounderFees{value: founderShare}(founderShare)
                            {
                                // Successfully relayed fees through the registry
                            } catch {
                                // If relay fails, send all fees to treasury
                                treasuryAmount = platformFee;
                                founderShare = 0;
                            }
                        }
                    } catch {
                        // If call fails, send all fees to treasury
                        treasuryAmount = platformFee;
                        founderShare = 0;
                    }
                }
            } catch {
                // If call fails, send all fees to treasury
                treasuryAmount = platformFee;
                founderShare = 0;
            }
        }

        // Update withdrawn funds
        _totalFundsWithdrawn += releaseAmount;

        // Send platform fee to treasury (minus founder share if applicable)
        (bool feeSuccess,) = _platformTreasury.call{value: treasuryAmount}("");
        require(feeSuccess, "Fee transfer failed");

        // Send funds to creator
        uint256 creatorAmount = releaseAmount - platformFee;
        (bool success,) = _creator.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(releaseAmount, _creator);
    }

    // ============================================================================
    // PROJECT CONFIGURATION FUNCTIONS
    // ============================================================================

    /**
     * @dev Set the project's NFT contract address (uses extension validation)
     */
    function setProjectNFTContract(address nftContract) external onlyRole(ADMIN_ROLE) {
        require(_projectNFTContract == address(0), "NFT contract already set");

        // Optional: Validate that the NFT contract is from a registered factory
        address nftFactory = IPlatformRegistry(_platformRegistry).getExtension(ExtensionKeys.NFT_FACTORY);
        if (nftFactory != address(0)) {
            // Could add validation logic here if needed
        }

        _projectNFTContract = nftContract;
    }

    /**
     * @dev Set the project's token contract address (uses extension validation)
     */
    function setProjectTokenContract(address tokenContract) external onlyRole(ADMIN_ROLE) {
        require(_projectTokenContract == address(0), "Token contract already set");

        // Optional: Validate that the token contract is from a registered factory
        address tokenFactory = IPlatformRegistry(_platformRegistry).getExtension(ExtensionKeys.TOKEN_FACTORY);
        if (tokenFactory != address(0)) {
            // Could add validation logic here if needed
        }

        _projectTokenContract = tokenContract;
    }

    /**
     * @dev Get the project's NFT contract address
     */
    function getProjectNFTContract() external view returns (address) {
        return _projectNFTContract;
    }

    /**
     * @dev Get the project's token contract address
     */
    function getProjectTokenContract() external view returns (address) {
        return _projectTokenContract;
    }

    // ============================================================================
    // TEAM MANAGEMENT FUNCTIONS
    // ============================================================================

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
     * @dev Check if address is team member
     */
    function isTeamMember(address member) external view returns (bool) {
        return _teamMembers[member];
    }

    // ============================================================================
    // PROJECT ADMINISTRATION FUNCTIONS
    // ============================================================================

    /**
     * @dev Cancel project (only possible before deadline)
     */
    function cancelProject() external onlyRole(ADMIN_ROLE) {
        require(_state == State.Active, "Cannot cancel non-active project");

        _state = State.Cancelled;
        emit ProjectStateChanged(State.Cancelled);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

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

    /**
     * @dev Get project isFlexibleFunding state
     */
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
     * @dev Get all investors
     */
    function getInvestors() external view returns (address[] memory) {
        return _investors;
    }

    /**
     * @dev Get project creator
     */
    function getCreator() external view returns (address) {
        return _creator;
    }

    /**
     * @dev Get funding goal
     */
    function getFundingGoal() external view returns (uint256) {
        return _fundingGoal;
    }

    /**
     * @dev Get total funds raised
     */
    function getTotalFundsRaised() external view returns (uint256) {
        return _totalFundsRaised;
    }

    /**
     * @dev Get total funds withdrawn
     */
    function getTotalFundsWithdrawn() external view returns (uint256) {
        return _totalFundsWithdrawn;
    }

    /**
     * @dev Get project deadline
     */
    function getDeadline() external view returns (uint256) {
        return _deadline;
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
     * @dev Get platform registry address
     */
    function getPlatformRegistry() external view returns (address) {
        return _platformRegistry;
    }

    /**
     * @dev Get project name
     */
    function getName() external view returns (string memory) {
        return _name;
    }

    /**
     * @dev Get project description
     */
    function getDescription() external view returns (string memory) {
        return _description;
    }

    // ============================================================================
    // RECEIVE FUNCTION
    // ============================================================================

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

    // ============================================================================
    // UPGRADE FUNCTIONS
    // ============================================================================

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }
}
