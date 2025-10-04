// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FounderNFTStorage
 * @dev Storage contract for FounderNFT with continuous reward system and platform configuration
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
    mapping(address => uint256[]) internal _userStakedTokens;
    mapping(address => mapping(uint256 => uint256)) internal _userStakedTokenIndex;

    // Core reward system variables
    uint256 internal _rewardRate; // ETH per second distributed to all stakers
    uint256 internal _lastUpdateTime; // Last time rewards were updated
    uint256 internal _rewardPerTokenStored; // Accumulated reward per token
    uint256 internal _totalStakedSupply; // Total number of staked tokens

    // Per-token reward tracking
    mapping(uint256 => uint256) internal _userRewardPerTokenPaid; // Last reward rate user was paid at
    mapping(uint256 => uint256) internal _rewards; // Earned but unclaimed rewards per token

    // Pending rewards
    uint256 internal _pendingRewards;

    // ============ NEW: Platform Configuration ============

    /**
     * @dev Platform configuration parameters
     * These values can be updated by admin and emit events for subgraph indexing
     */
    uint256 internal _baseAPR; // Base annual percentage rate in basis points (e.g., 500 = 5%)
    uint256 internal _performanceMultiplier; // Performance-based reward multiplier (100 = 1x, 150 = 1.5x)
    uint256 internal _rewardCalculationPeriod; // Period for reward calculations in seconds
    uint256 internal _maxStakeAmount; // Maximum amount that can be staked (0 = unlimited)
    bool internal _emergencyWithdrawEnabled; // Whether emergency withdrawals are allowed
    uint256 internal _lastConfigUpdate; // Timestamp of last configuration update

    // Storage gap for future upgrades (reduced by 6 slots for new config variables)
    uint256[44] private __gap;

    event EarlyAccessProjectAdded(address indexed projectAddress);
    event EarlyAccessProjectRemoved(address indexed projectAddress);
}
