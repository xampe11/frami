// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

    // Extension contracts
    address internal _projectNFTContract;
    address internal _projectTokenContract;

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

    // Reserved storage gap for future upgrades
    uint256[47] private __gap;
}
