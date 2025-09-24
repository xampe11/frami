import { gql } from "@apollo/client";

// FIXED: User Dashboard Query - ONLY includes fields that exist in current subgraph
export const GET_USER_DASHBOARD = gql`
  query GetUserDashboard($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked
      totalRewardsEarned
      totalRewardsClaimed
      firstInteraction
      lastInteraction
      createdAt
      updatedAt

      nfts {
        id
        tokenId
        isStaked
        currentStaker {
          id
        }
        stakingSince
        totalRewardsEarned
        totalRewardsClaimed

        # These fields are implemented in current subgraph
        pendingRewards
        claimableAmount
        lastRewardCalculation
        rewardAccumulationRate

        # Computed fields that exist
        canUnstake
        nextUnstakeDate
        stakingDuration
        mintedAt
        lastRewardUpdate
        createdAt
        updatedAt
      }

      stakingHistory(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        action
        timestamp
        blockNumber
        transactionHash
        rewardPerTokenAtTime
        nft {
          tokenId
        }
      }

      rewardsClaimed(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        blockNumber
        transactionHash
        nft {
          tokenId
        }
      }
    }
  }
`;

// FIXED: Platform Stats Query - only implemented fields
export const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    platformStats(id: "0x706c6174666f726d") {
      id
      totalNFTsMinted
      totalNFTsStaked
      totalUsers
      totalStakers
      totalRewardsDistributed
      currentRewardRate
      totalETHReceived

      # Only include if these are actually implemented in your subgraph
      currentAPY
      currentAPR
      averageStakingDuration
      participationRate

      lastUpdated
    }

    # Get recent ETH received events
    ethReceiveds(first: 5, orderBy: timestamp, orderDirection: desc) {
      id
      from
      amount
      timestamp
      blockNumber
      transactionHash
    }

    # Get recent reward rate updates
    rewardRates(first: 5, orderBy: timestamp, orderDirection: desc) {
      id
      oldRate
      newRate
      timestamp
      blockNumber
      transactionHash
    }
  }
`;

// SIMPLIFIED: User Profile Query without non-existent fields
export const GET_USER_PROFILE = gql`
  query GetUserProfile($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked
      totalRewardsEarned
      totalRewardsClaimed
      firstInteraction
      lastInteraction

      # Get user's NFTs
      nfts {
        id
        tokenId
        isStaked
        totalRewardsEarned
        totalRewardsClaimed
        mintedAt
      }

      # Recent staking history
      stakingHistory(first: 20, orderBy: timestamp, orderDirection: desc) {
        id
        action
        timestamp
        nft {
          tokenId
        }
      }

      # Recent reward claims
      rewardsClaimed(first: 20, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        nft {
          tokenId
        }
      }
    }
  }
`;

// NEW: Minimal query for basic NFT data
export const GET_USER_NFTS = gql`
  query GetUserNFTs($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked

      nfts {
        id
        tokenId
        isStaked
        currentStaker {
          id
        }
        stakingSince
        totalRewardsEarned
        pendingRewards
        canUnstake
        nextUnstakeDate
        mintedAt
      }
    }
  }
`;

// NEW: Real-time staking data query
export const GET_STAKING_DATA = gql`
  query GetStakingData {
    platformStats(id: "0x706c6174666f726d") {
      totalNFTsStaked
      totalStakers
      currentRewardRate
      totalRewardsDistributed
      lastUpdated
    }
  }
`;

// NEW: Recent activity query
export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($limit: Int = 20) {
    stakeEvents(first: $limit, orderBy: timestamp, orderDirection: desc) {
      id
      action
      timestamp
      user {
        id
      }
      nft {
        tokenId
      }
      transactionHash
    }

    rewardClaims(first: $limit, orderBy: timestamp, orderDirection: desc) {
      id
      amount
      timestamp
      user {
        id
      }
      nft {
        tokenId
      }
      transactionHash
    }
  }
`;

export const GET_PLATFORM_CONFIG = gql`
  query GetPlatformConfig {
    platformConfig(id: "0x636f6e666967") {
      id
      minimumStakingPeriod
      baseAPR
      performanceMultiplier
      rewardCalculationPeriod
      maxStakeAmount
      emergencyWithdrawEnabled
      lastConfigUpdate
    }
  }
`;

// COMMENT: Queries for PHASE 2 - After subgraph enhancements
// These are currently commented out because the fields don't exist yet

/*
// FUTURE: Enhanced User Analytics (after Phase 2)
export const GET_USER_ANALYTICS = gql`
  query GetUserAnalytics($userAddress: ID!) {
    user(id: $userAddress) {
      id
      membershipLevel
      stakingEfficiency
      totalFeesPaid
      
      analytics {
        averageStakingDuration
        totalTransactions
        stakingStreak
        longestStakingStreak
        rewardEfficiency
        riskProfile
        membershipTier
        lastActivityDate
      }
      
      feeAnalytics {
        totalFeespaid
        stakingFees
        claimFees
        lastFeePayment
      }
    }
  }
`;

// FUTURE: APY Snapshots (after Phase 2)
export const GET_APY_HISTORY = gql`
  query GetAPYHistory($limit: Int = 30) {
    apySnapshots(first: $limit, orderBy: date, orderDirection: desc) {
      id
      date
      currentAPY
      currentAPR
      totalStakedValue
      rewardRate
      participationRate
      averageStakingDuration
    }
  }
`;

// FUTURE: User Fees (after Phase 2)
export const GET_USER_FEES = gql`
  query GetUserFees($userAddress: ID!, $first: Int = 50) {
    user(id: $userAddress) {
      id
      totalFeesPaid

      feeAnalytics {
        totalFeespaid
        stakingFees
        claimFees
        lastFeePayment
      }
    }

    feeCollections(
      where: { user: $userAddress }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      feeType
      amount
      timestamp
      transactionHash
      feeDestination
    }
  }
`;
*/
