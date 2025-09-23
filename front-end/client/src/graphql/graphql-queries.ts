import { gql } from "@apollo/client";

// Enhanced User Dashboard Query - gets all user data needed for dashboard
export const GET_USER_DASHBOARD = gql`
  query GetUserDashboard($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked
      totalRewardsEarned
      totalRewardsClaimed

      # NEW: Enhanced user fields
      totalFeesPaid
      stakingEfficiency
      membershipLevel

      firstInteraction
      lastInteraction

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

        # NEW: Real-time reward fields
        pendingRewards
        claimableAmount
        lastRewardCalculation
        rewardAccumulationRate

        # Existing computed fields
        canUnstake
        nextUnstakeDate
        stakingDuration
        mintedAt
      }

      # NEW: User analytics
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

      # NEW: Fee analytics
      feeAnalytics {
        totalFeespaid
        stakingFees
        claimFees
        lastFeePayment
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

    # Enhanced platform stats with APY/APR
    platformStats(id: "0x706c6174666f726d") {
      id
      totalNFTsMinted
      totalNFTsStaked
      totalUsers
      totalStakers
      totalRewardsDistributed
      currentRewardRate
      totalETHReceived

      # NEW: Dynamic rate calculations
      currentAPY
      currentAPR
      averageStakingDuration
      participationRate

      lastUpdated
    }

    # NEW: Platform configuration
    platformConfig(id: "0x636f6e666967") {
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

// Enhanced Platform Stats Query - now includes APY/APR data
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

      # NEW: Enhanced metrics
      currentAPY
      currentAPR
      averageStakingDuration
      participationRate

      lastUpdated
    }

    # NEW: Platform configuration
    platformConfig(id: "0x636f6e666967") {
      minimumStakingPeriod
      baseAPR
      performanceMultiplier
      rewardCalculationPeriod
      maxStakeAmount
      emergencyWithdrawEnabled
    }

    # NEW: Recent APY snapshots for trending
    apySnapshots(first: 7, orderBy: date, orderDirection: desc) {
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

// Enhanced User NFTs Query - with real-time reward data
export const GET_USER_NFTS = gql`
  query GetUserNFTs($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked
      totalRewardsEarned
      totalRewardsClaimed

      # NEW: Enhanced user metrics
      stakingEfficiency
      membershipLevel

      nfts(orderBy: tokenId, orderDirection: asc) {
        id
        tokenId
        isStaked
        currentStaker {
          id
        }
        stakingSince
        totalRewardsEarned
        totalRewardsClaimed

        # NEW: Real-time calculations
        pendingRewards
        claimableAmount
        lastRewardCalculation
        rewardAccumulationRate

        canUnstake
        nextUnstakeDate
        stakingDuration
        mintedAt
      }

      # NEW: User analytics for dashboard insights
      analytics {
        averageStakingDuration
        stakingStreak
        rewardEfficiency
        membershipTier
      }
    }
  }
`;

// Enhanced User Staked NFTs Query - optimized for staking interface
export const GET_USER_STAKED_NFTS = gql`
  query GetUserStakedNFTs($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsStaked
      totalRewardsEarned

      nfts(where: { isStaked: true }) {
        id
        tokenId
        isStaked
        currentStaker {
          id
        }
        stakingSince
        totalRewardsEarned
        totalRewardsClaimed

        # NEW: Critical for staking UI
        pendingRewards
        claimableAmount
        rewardAccumulationRate

        canUnstake
        nextUnstakeDate
        stakingDuration
        mintedAt
      }
    }

    # Include platform config for staking rules
    platformConfig(id: "0x636f6e666967") {
      minimumStakingPeriod
      baseAPR
      maxStakeAmount
    }
  }
`;

// Enhanced Recent Activity Query - includes fee tracking
export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($userAddress: ID!, $first: Int = 20) {
    user(id: $userAddress) {
      id

      stakingHistory(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        nft {
          tokenId
        }
        action
        timestamp
        blockNumber
        transactionHash
        rewardPerTokenAtTime
      }

      rewardsClaimed(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        nft {
          tokenId
        }
        amount
        timestamp
        blockNumber
        transactionHash
      }
    }

    # NEW: Recent fee collections for this user
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

// Enhanced Staking Rewards Query - comprehensive reward tracking
export const GET_STAKING_REWARDS = gql`
  query GetStakingRewards($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalRewardsEarned
      totalRewardsClaimed

      # NEW: Fee information
      totalFeesPaid

      nfts(where: { isStaked: true }) {
        id
        tokenId
        stakingSince
        totalRewardsEarned
        totalRewardsClaimed

        # NEW: Real-time reward data
        pendingRewards
        claimableAmount
        rewardAccumulationRate
        lastRewardCalculation

        canUnstake
        nextUnstakeDate
        stakingDuration
      }

      # NEW: User analytics for reward optimization
      analytics {
        rewardEfficiency
        averageStakingDuration
        stakingStreak
      }

      # NEW: Fee analytics
      feeAnalytics {
        totalFeespaid
        stakingFees
        claimFees
      }
    }

    # Platform context for reward calculations
    platformStats(id: "0x706c6174666f726d") {
      currentRewardRate
      currentAPY
      currentAPR
    }

    platformConfig(id: "0x636f6e666967") {
      baseAPR
      performanceMultiplier
      rewardCalculationPeriod
    }
  }
`;

// NEW: Comprehensive Analytics Query - for dashboard insights
export const GET_USER_ANALYTICS = gql`
  query GetUserAnalytics($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked
      totalRewardsEarned
      totalRewardsClaimed
      totalFeesPaid
      stakingEfficiency
      membershipLevel

      analytics {
        averageStakingDuration
        totalTransactions
        stakingStreak
        longestStakingStreak
        rewardEfficiency
        riskProfile
        lastActivityDate
        membershipTier
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

// NEW: Platform Performance Query - for admin/analytics dashboard
export const GET_PLATFORM_PERFORMANCE = gql`
  query GetPlatformPerformance($days: Int = 30) {
    platformStats(id: "0x706c6174666f726d") {
      totalNFTsMinted
      totalNFTsStaked
      totalUsers
      totalStakers
      totalRewardsDistributed
      currentRewardRate
      currentAPY
      currentAPR
      participationRate
      averageStakingDuration
    }

    # Historical APY data
    apySnapshots(first: $days, orderBy: date, orderDirection: desc) {
      date
      currentAPY
      currentAPR
      totalStakedValue
      participationRate
      averageStakingDuration
    }

    # Daily snapshots for trends
    dailySnapshots(first: $days, orderBy: date, orderDirection: desc) {
      date
      totalStaked
      totalStakers
      totalUsers
      rewardsDistributed
      newStakers
      newUsers
      averageStakingDuration
      rewardRate
    }
  }
`;

// NEW: User Fee Summary Query - for fee transparency
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

// NEW: Real-time Rewards Query - for live reward tracking
export const GET_REALTIME_REWARDS = gql`
  query GetRealtimeRewards($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalRewardsEarned
      totalRewardsClaimed

      nfts(where: { isStaked: true }) {
        id
        tokenId
        stakingSince

        # Focus on real-time data
        pendingRewards
        claimableAmount
        rewardAccumulationRate
        lastRewardCalculation

        canUnstake
        nextUnstakeDate
      }
    }

    platformStats(id: "0x706c6174666f726d") {
      currentRewardRate
      lastUpdated
    }
  }
`;

// NEW: Membership Tier Query - for gamification features
export const GET_USER_MEMBERSHIP = gql`
  query GetUserMembership($userAddress: ID!) {
    user(id: $userAddress) {
      id
      membershipLevel
      stakingEfficiency

      analytics {
        stakingStreak
        longestStakingStreak
        rewardEfficiency
        riskProfile
        membershipTier
        totalTransactions
      }
    }
  }
`;
