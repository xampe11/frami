// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVerificationOracle {
    function verifyMilestone(address project, uint256 milestoneId) external view returns (bool);
}

contract Project is Ownable, ReentrancyGuard {
    // Project configuration
    string public name;
    string public description;
    address public creator;
    uint256 public fundingGoal;
    uint256 public deadline;
    bool public isFlexibleFunding;
    uint256 public platformFeePercentage;
    address public platformTreasury;
    address public platformRegistry;
    address public verificationOracle;

    // Project state
    enum State {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    State public state;

    uint256 public totalFundsRaised;
    uint256 public totalFundsWithdrawn;
    uint256 public totalInvestors;

    // Milestone tracking
    struct Milestone {
        string description;
        uint256 fundingPercentage; // percentage of total funds (in basis points)
        bool completed;
        bool fundsReleased;
        uint256 votesNeeded;
        uint256 votesReceived;
        mapping(address => bool) investorVoted;
    }

    uint256 public milestoneCount;
    mapping(uint256 => Milestone) public milestones;

    // Team members
    mapping(address => bool) public teamMembers;

    // Investor tracking
    mapping(address => uint256) public investments;
    address[] public investors;

    // Events
    event FundingReceived(address indexed investor, uint256 amount);
    event MilestoneCreated(uint256 indexed milestoneId, string description, uint256 fundingPercentage);
    event MilestoneCompleted(uint256 indexed milestoneId);
    event MilestoneVoteReceived(uint256 indexed milestoneId, address indexed investor);
    event FundsWithdrawn(uint256 amount, address recipient);
    event ProjectStateChanged(State newState);
    event RefundIssued(address indexed investor, uint256 amount);

    // Modifiers
    modifier onlyActiveFunding() {
        require(state == State.Active, "Project not active");
        require(block.timestamp < deadline, "Funding period ended");
        _;
    }

    modifier onlyAfterDeadline() {
        require(block.timestamp >= deadline, "Funding period not ended");
        _;
    }

    modifier onlyTeamMember() {
        require(teamMembers[msg.sender] || msg.sender == creator, "Not authorized");
        _;
    }

    modifier onlyInvestor() {
        require(investments[msg.sender] > 0, "Not an investor");
        _;
    }

    modifier onlyVerificationOracle() {
        require(msg.sender == verificationOracle, "Not authorized oracle");
        _;
    }

    // Constructor
    constructor(
        address _creator,
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration,
        bool _isFlexibleFunding,
        uint256 _platformFeePercentage,
        address _platformTreasury,
        address _verificationOracle,
        address _platformRegistry
    ) Ownable(_creator) ReentrancyGuard() {
        creator = _creator;
        name = _name;
        description = _description;
        fundingGoal = _fundingGoal;
        deadline = block.timestamp + _duration;
        isFlexibleFunding = _isFlexibleFunding;
        platformFeePercentage = _platformFeePercentage;
        platformTreasury = _platformTreasury;
        verificationOracle = _verificationOracle;
        platformRegistry = _platformRegistry;
        state = State.Active;

        // Creator is automatically a team member
        teamMembers[_creator] = true;
    }

    // Core functions

    // Invest in project with native token (ETH)
    function invest() external payable onlyActiveFunding nonReentrant {
        require(msg.value > 0, "Investment must be greater than 0");

        // Update investment records
        if (investments[msg.sender] == 0) {
            investors.push(msg.sender);
            totalInvestors++;
        }

        investments[msg.sender] += msg.value;
        totalFundsRaised += msg.value;

        emit FundingReceived(msg.sender, msg.value);
    }

    // Check and update project state based on deadline and funds raised
    function checkAndUpdateState() public onlyAfterDeadline returns (State) {
        if (state != State.Active) {
            return state;
        }

        if (totalFundsRaised >= fundingGoal) {
            state = State.Successful;
        } else {
            if (isFlexibleFunding) {
                state = State.Successful; // Flexible funding allows any amount
            } else {
                state = State.Failed; // All-or-nothing requires meeting goal
            }
        }

        emit ProjectStateChanged(state);
        return state;
    }

    // Create project milestone
    function createMilestone(string memory _description, uint256 _fundingPercentage) external onlyTeamMember {
        require(_fundingPercentage > 0 && _fundingPercentage <= 10000, "Invalid percentage");

        uint256 milestoneId = milestoneCount;
        Milestone storage newMilestone = milestones[milestoneId];

        newMilestone.description = _description;
        newMilestone.fundingPercentage = _fundingPercentage;
        newMilestone.completed = false;
        newMilestone.fundsReleased = false;
        // Require 51% of investors by investment amount to approve
        newMilestone.votesNeeded = (totalInvestors * 51) / 100;

        milestoneCount++;

        emit MilestoneCreated(milestoneId, _description, _fundingPercentage);
    }

    // Mark milestone as completed (requires oracle verification)
    function submitMilestoneCompletion(uint256 _milestoneId) external onlyTeamMember {
        require(_milestoneId < milestoneCount, "Invalid milestone");
        require(!milestones[_milestoneId].completed, "Already completed");
        require(state == State.Successful, "Project not successful");

        bool verified = IVerificationOracle(verificationOracle).verifyMilestone(address(this), _milestoneId);
        require(verified, "Milestone verification failed");

        milestones[_milestoneId].completed = true;

        emit MilestoneCompleted(_milestoneId);
    }

    // Vote for milestone completion (investor governance)
    function voteMilestone(uint256 _milestoneId) external onlyInvestor {
        require(_milestoneId < milestoneCount, "Invalid milestone");
        require(milestones[_milestoneId].completed, "Milestone not completed");
        require(!milestones[_milestoneId].investorVoted[msg.sender], "Already voted");

        milestones[_milestoneId].investorVoted[msg.sender] = true;
        milestones[_milestoneId].votesReceived++;

        emit MilestoneVoteReceived(_milestoneId, msg.sender);
    }

    // Release funds for completed milestone
    function releaseMilestoneFunds(uint256 _milestoneId) external onlyTeamMember nonReentrant {
        require(_milestoneId < milestoneCount, "Invalid milestone");
        require(milestones[_milestoneId].completed, "Milestone not completed");
        require(!milestones[_milestoneId].fundsReleased, "Funds already released");
        require(state == State.Successful, "Project not successful");
        require(milestones[_milestoneId].votesReceived >= milestones[_milestoneId].votesNeeded, "Not enough votes");

        milestones[_milestoneId].fundsReleased = true;

        // Calculate funds to release based on percentage
        uint256 releaseAmount = (totalFundsRaised * milestones[_milestoneId].fundingPercentage) / 10000;
        uint256 platformFee = (releaseAmount * platformFeePercentage) / 10000;
        uint256 creatorAmount = releaseAmount - platformFee;

        // Update withdrawn funds
        totalFundsWithdrawn += releaseAmount;

        // Send platform fee
        (bool feeSuccess,) = platformTreasury.call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");

        // Send funds to creator
        (bool success,) = creator.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(releaseAmount, creator);
    }

    // Claim refund if project failed (all-or-nothing model only)
    function claimRefund() external onlyInvestor nonReentrant {
        require(state == State.Failed, "Refunds not available");
        require(!isFlexibleFunding, "No refunds for flexible funding");

        uint256 refundAmount = investments[msg.sender];
        require(refundAmount > 0, "No funds to refund");

        // Reset investor's contribution
        investments[msg.sender] = 0;

        // Send refund
        (bool success,) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit RefundIssued(msg.sender, refundAmount);
    }

    // Cancel project (only possible before deadline)
    function cancelProject() external onlyOwner {
        require(state == State.Active, "Cannot cancel non-active project");

        state = State.Cancelled;
        emit ProjectStateChanged(State.Cancelled);
    }

    // Team management
    function addTeamMember(address _member) external onlyOwner {
        teamMembers[_member] = true;
    }

    function removeTeamMember(address _member) external onlyOwner {
        require(_member != creator, "Cannot remove creator");
        teamMembers[_member] = false;
    }

    // Getter functions
    function getProjectDetails()
        external
        view
        returns (
            string memory _name,
            string memory _description,
            address _creator,
            uint256 _fundingGoal,
            uint256 _deadline,
            uint256 _totalFundsRaised,
            State _state,
            bool _isFlexibleFunding
        )
    {
        return (name, description, creator, fundingGoal, deadline, totalFundsRaised, state, isFlexibleFunding);
    }

    function getInvestorCount() external view returns (uint256) {
        return totalInvestors;
    }

    function getInvestmentAmount(address _investor) external view returns (uint256) {
        return investments[_investor];
    }

    function isMilestoneCompleted(uint256 _milestoneId) external view returns (bool) {
        return milestones[_milestoneId].completed;
    }

    function areMilestoneFundsReleased(uint256 _milestoneId) external view returns (bool) {
        return milestones[_milestoneId].fundsReleased;
    }

    // Receive function to accept ETH
    receive() external payable {
        // Only allow direct ETH transfers during active funding
        require(state == State.Active, "Project not active");
        require(block.timestamp < deadline, "Funding period ended");

        // Process as investment
        if (investments[msg.sender] == 0) {
            investors.push(msg.sender);
            totalInvestors++;
        }

        investments[msg.sender] += msg.value;
        totalFundsRaised += msg.value;

        emit FundingReceived(msg.sender, msg.value);
    }
}
