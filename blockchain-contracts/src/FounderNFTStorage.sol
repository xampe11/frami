// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FounderNFTStorage
 * @dev Storage contract for FounderNFT
 */
contract FounderNFTStorage {
    // Token ID counter
    uint256 internal _nextTokenId;

    // Platform registry
    address internal _platformRegistry;

    // Sale configuration
    uint256 internal _maxSupply;
    uint256 internal _price;
    bool internal _saleActive;

    // Sales proceeds tracking (separate from distribution pool)
    uint256 internal _totalSalesProceeds;

    // Fee distribution tracking
    uint256 internal _totalUndistributedFees;

    // Platform fee distribution percentage (e.g., 3000 = 30%)
    uint256 internal _platformFeeDistributionPercentage;

    // DAO token allocation percentage for founders
    uint256 internal _daoTokenAllocationPercentage;

    // Early access configuration
    mapping(address => bool) internal _earlyAccessProjects;

    // Staking related storage
    struct StakeInfo {
        address owner;
        uint256 stakedSince;
        uint256 lastRewardsClaimed;
    }

    // Mapping from tokenId to staking info
    mapping(uint256 => StakeInfo) internal _stakedTokens;

    // Number of staked tokens
    uint256 internal _totalStakedTokens;

    // Minimum staking period (in seconds)
    uint256 internal _minimumStakingPeriod;

    // Reserved storage gap for future upgrades
    uint256[47] private __gap;
}
