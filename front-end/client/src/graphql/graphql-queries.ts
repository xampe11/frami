import { gql } from "@apollo/client";

// User Dashboard Query - gets all user data needed for dashboard
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
        canUnstake
        nextUnstakeDate
        stakingDuration
        mintedAt
      }
      stakingHistory(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        action
        timestamp
        blockNumber
        transactionHash
      }
      rewardsClaimed(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        amount
        timestamp
        blockNumber
        transactionHash
      }
    }
  }
`;

// Platform Stats Query - for overall platform metrics
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
      lastUpdated
    }
  }
`;

// User NFTs Query - specifically for NFT collection view
export const GET_USER_NFTS = gql`
  query GetUserNFTs($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalNFTsOwned
      totalNFTsStaked
      nfts(orderBy: tokenId, orderDirection: asc) {
        id
        tokenId
        isStaked
        currentStaker
        stakingSince
        totalRewardsEarned
        totalRewardsClaimed
        canUnstake
        nextUnstakeDate
        stakingDuration
        mintedAt
      }
    }
  }
`;

// Recent Activity Query - for activity feeds
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
  }
`;

// Staking Rewards Query - for detailed reward tracking
export const GET_STAKING_REWARDS = gql`
  query GetStakingRewards($userAddress: ID!) {
    user(id: $userAddress) {
      id
      totalRewardsEarned
      totalRewardsClaimed
      nfts(where: { isStaked: true }) {
        id
        tokenId
        stakingSince
        totalRewardsEarned
        totalRewardsClaimed
        canUnstake
        nextUnstakeDate
        stakingDuration
      }
    }
  }
`;
