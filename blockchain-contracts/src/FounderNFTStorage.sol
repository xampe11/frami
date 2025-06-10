// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FounderNFTStorage
 * @dev Storage contract for ModernFounderNFT with continuous reward system
 * @notice Replaces weekly epoch system with Synthetix-style continuous rewards
 */
contract FounderNFTStorage {
    address internal _platformRegistry;
    uint256 internal _maxSupply;
    uint256 internal _price;
    uint256 internal _platformFeeDistributionPercentage;
    uint256 internal _daoTokenAllocationPercentage;
    uint256 internal _minimumStakingPeriod;
    uint256 internal _nextTokenId;
    uint256 internal _totalSalesProceeds;
    bool internal _saleActive;

    // Early access projects mapping
    mapping(address => bool) internal _earlyAccessProjects;

    // Staking information structure
    struct StakeInfo {
        address owner;
        uint256 stakedSince;
        uint256 lastRewardsClaimed;
    }

    // Token staking information
    mapping(uint256 => StakeInfo) internal _stakedTokens;

    // Core reward system variables (Synthetix pattern)
    uint256 internal _rewardRate; // ETH per second distributed to all stakers
    uint256 internal _lastUpdateTime; // Last time rewards were updated
    uint256 internal _rewardPerTokenStored; // Accumulated reward per token
    uint256 internal _totalStakedSupply; // Total number of staked tokens

    // Per-token reward tracking
    mapping(uint256 => uint256) internal _userRewardPerTokenPaid; // Last reward rate user was paid at
    mapping(uint256 => uint256) internal _rewards; // Earned but unclaimed rewards per token

    // Pending rewards
    uint256 internal _pendingRewards;

    event EarlyAccessProjectAdded(address indexed projectAddress);
    event EarlyAccessProjectRemoved(address indexed projectAddress);
}
