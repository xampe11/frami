// graphql/src/founder-nft.ts - REVISED APPROACH

import { BigInt, BigDecimal, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  FounderNFTMinted,
  TokenStaked,
  TokenUnstaked,
  RewardClaimed,
  RewardRateUpdated,
  RewardAdded,
  ETHReceived,
  ConfigurationInitialized,
  ConfigurationUpdated,
  MinimumStakingPeriodUpdated,
  BaseAPRUpdated,
  EmergencyWithdrawToggled,
} from "../generated/FounderNFT/FounderNFT";
import {
  User,
  FounderNFT,
  StakeEvent,
  PlatformStats,
  RewardClaim,
  RewardRate,
  ETHReceived as ETHReceivedEntity,
  PlatformConfig,
} from "../generated/schema";

// Constants
const ZERO_BI = BigInt.fromI32(0);
const ZERO_BD = BigDecimal.fromString("0");
const PLATFORM_ID = Bytes.fromHexString("0x706c6174666f726d");
const CONFIG_ID = Bytes.fromHexString("0x636f6e666967");

function toDecimal(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigDecimal.fromString("1000000000000000000"));
}

function getOrCreateUser(address: Address, timestamp: BigInt): User {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.totalNFTsOwned = 0;
    user.totalNFTsStaked = 0;
    user.totalRewardsEarned = ZERO_BD;
    user.totalRewardsClaimed = ZERO_BD;
    user.firstInteraction = timestamp;
    user.createdAt = timestamp;
    user.updatedAt = timestamp;
    user.lastInteraction = timestamp;
    user.save();
  } else {
    user.updatedAt = timestamp;
    user.lastInteraction = timestamp;
    user.save();
  }
  return user as User;
}

function getOrCreatePlatformStats(timestamp: BigInt): PlatformStats {
  let stats = PlatformStats.load(PLATFORM_ID);
  if (stats == null) {
    stats = new PlatformStats(PLATFORM_ID);
    stats.totalNFTsMinted = 0;
    stats.totalNFTsStaked = 0;
    stats.totalUsers = 0;
    stats.totalStakers = 0;
    stats.totalRewardsDistributed = ZERO_BD;
    stats.currentRewardRate = ZERO_BD;
    stats.totalETHReceived = ZERO_BD;
    stats.currentAPY = ZERO_BD;
    stats.currentAPR = ZERO_BD;
    stats.averageStakingDuration = ZERO_BD;
    stats.participationRate = ZERO_BD;
    stats.lastUpdated = timestamp;
    stats.save();
  }
  return stats as PlatformStats;
}

function getOrCreatePlatformConfig(
  contractAddress: Address,
  timestamp: BigInt
): PlatformConfig {
  let config = PlatformConfig.load(CONFIG_ID);
  if (config == null) {
    config = new PlatformConfig(CONFIG_ID);
    config.minimumStakingPeriod = BigInt.fromI32(7 * 24 * 60 * 60); // 7 days default
    config.baseAPR = BigInt.fromI32(500); // 5% default
    config.performanceMultiplier = BigInt.fromI32(100);
    config.rewardCalculationPeriod = BigInt.fromI32(3600); // 1 hour
    config.maxStakeAmount = BigInt.fromI32(10000);
    config.emergencyWithdrawEnabled = false;
    config.lastConfigUpdate = timestamp;
    config.save();
  }
  return config as PlatformConfig;
}

function updatePlatformMetrics(timestamp: BigInt): void {
  let stats = getOrCreatePlatformStats(timestamp);

  // Calculate participation rate
  if (stats.totalNFTsMinted > 0) {
    stats.participationRate = BigDecimal.fromString(
      stats.totalNFTsStaked.toString()
    )
      .div(BigDecimal.fromString(stats.totalNFTsMinted.toString()))
      .times(BigDecimal.fromString("100"));
  }

  stats.lastUpdated = timestamp;
  stats.save();
}

// ==================== EVENT HANDLERS ====================

export function handleFounderNFTMinted(event: FounderNFTMinted): void {
  let tokenId = event.params.tokenId;
  let to = event.params.to;
  let timestamp = event.block.timestamp;

  // Create user if needed
  let user = getOrCreateUser(to, timestamp);
  user.totalNFTsOwned = user.totalNFTsOwned + 1;
  user.save();

  // Create NFT entity with minimal data
  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = new FounderNFT(nftId);
  nft.tokenId = tokenId;
  nft.currentOwner = to;
  nft.mintedBy = to;
  nft.isStaked = false;
  nft.currentStaker = null;
  nft.stakingSince = null;
  nft.totalRewardsEarned = ZERO_BD; // Historical total
  nft.totalRewardsClaimed = ZERO_BD; // Historical total

  // ✅ METADATA for frontend calculation (NOT live rewards)
  nft.pendingRewards = ZERO_BD; // Snapshot at last event
  nft.lastRewardCalculation = timestamp; // When we last knew the state
  nft.rewardAccumulationRate = ZERO_BD;
  nft.claimableAmount = ZERO_BD;

  nft.lastRewardUpdate = timestamp;
  nft.canUnstake = false;
  nft.nextUnstakeDate = null;
  nft.stakingDuration = ZERO_BI;
  nft.mintedAt = timestamp;
  nft.createdAt = timestamp;
  nft.updatedAt = timestamp;
  nft.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.totalNFTsMinted = platformStats.totalNFTsMinted + 1;

  if (user.totalNFTsOwned == 1) {
    platformStats.totalUsers = platformStats.totalUsers + 1;
  }

  updatePlatformMetrics(timestamp);
}

export function handleTokenStaked(event: TokenStaked): void {
  let tokenId = event.params.tokenId;
  let owner = event.params.owner;
  let timestamp = event.block.timestamp;

  let config = getOrCreatePlatformConfig(event.address, timestamp);

  // Load or create NFT
  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = FounderNFT.load(nftId);
  let isNewNFT = false;

  if (nft == null) {
    nft = new FounderNFT(nftId);
    nft.tokenId = tokenId;
    nft.currentOwner = owner;
    nft.mintedBy = owner;
    nft.totalRewardsEarned = ZERO_BD;
    nft.totalRewardsClaimed = ZERO_BD;
    nft.mintedAt = timestamp;
    nft.createdAt = timestamp;
    isNewNFT = true;
  }

  // Update staking status
  nft.isStaked = true;
  nft.currentStaker = owner;
  nft.stakingSince = timestamp; // ✅ CRITICAL for frontend calculation
  nft.canUnstake = false;
  nft.nextUnstakeDate = timestamp.plus(config.minimumStakingPeriod);
  nft.stakingDuration = ZERO_BI;
  nft.updatedAt = timestamp;
  nft.lastRewardUpdate = timestamp;

  // ✅ RESET calculation metadata when staking starts
  nft.pendingRewards = ZERO_BD; // Zero at staking start
  nft.claimableAmount = ZERO_BD;
  nft.lastRewardCalculation = timestamp; // Checkpoint for frontend
  nft.rewardAccumulationRate = ZERO_BD;

  nft.save();

  // Update user
  let user = getOrCreateUser(owner, timestamp);
  user.totalNFTsStaked = user.totalNFTsStaked + 1;
  if (isNewNFT) {
    user.totalNFTsOwned = user.totalNFTsOwned + 1;
  }
  user.save();

  // Create stake event
  let stakeEventId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let stakeEvent = new StakeEvent(stakeEventId);
  stakeEvent.nft = nftId;
  stakeEvent.user = owner;
  stakeEvent.action = "STAKE";
  stakeEvent.timestamp = timestamp;
  stakeEvent.blockNumber = event.block.number;
  stakeEvent.transactionHash = event.transaction.hash;
  stakeEvent.rewardPerTokenAtTime = ZERO_BD;
  stakeEvent.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.totalNFTsStaked = platformStats.totalNFTsStaked + 1;

  if (isNewNFT) {
    platformStats.totalNFTsMinted = platformStats.totalNFTsMinted + 1;
    if (user.totalNFTsOwned == 1) {
      platformStats.totalUsers = platformStats.totalUsers + 1;
    }
  }

  if (user.totalNFTsStaked == 1) {
    platformStats.totalStakers = platformStats.totalStakers + 1;
  }

  updatePlatformMetrics(timestamp);
}

export function handleTokenUnstaked(event: TokenUnstaked): void {
  let tokenId = event.params.tokenId;
  let owner = event.params.owner;
  let timestamp = event.block.timestamp;

  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = FounderNFT.load(nftId);
  if (nft == null) return;

  // Calculate final staking duration
  if (nft.stakingSince !== null) {
    let stakingSinceValue = nft.stakingSince as BigInt;
    nft.stakingDuration = timestamp.minus(stakingSinceValue);
  } else {
    nft.stakingDuration = ZERO_BI;
  }

  // Update staking status
  nft.isStaked = false;
  nft.currentStaker = null;
  nft.stakingSince = null;
  nft.canUnstake = false;
  nft.nextUnstakeDate = null;
  nft.updatedAt = timestamp;
  nft.lastRewardUpdate = timestamp;

  // ✅ Rewards are auto-claimed on unstake, so reset
  nft.pendingRewards = ZERO_BD;
  nft.claimableAmount = ZERO_BD;
  nft.lastRewardCalculation = timestamp;

  nft.save();

  // Update user
  let user = getOrCreateUser(owner, timestamp);
  user.totalNFTsStaked = user.totalNFTsStaked - 1;
  user.save();

  // Create event
  let stakeEventId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let stakeEvent = new StakeEvent(stakeEventId);
  stakeEvent.nft = nftId;
  stakeEvent.user = owner;
  stakeEvent.action = "UNSTAKE";
  stakeEvent.timestamp = timestamp;
  stakeEvent.blockNumber = event.block.number;
  stakeEvent.transactionHash = event.transaction.hash;
  stakeEvent.rewardPerTokenAtTime = ZERO_BD;
  stakeEvent.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.totalNFTsStaked = platformStats.totalNFTsStaked - 1;

  if (user.totalNFTsStaked == 0) {
    platformStats.totalStakers = platformStats.totalStakers - 1;
  }

  updatePlatformMetrics(timestamp);
}

export function handleRewardClaimed(event: RewardClaimed): void {
  let tokenId = event.params.tokenId;
  let amount = event.params.amount;
  let user = event.params.user;
  let timestamp = event.block.timestamp;

  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = FounderNFT.load(nftId);
  if (nft == null) return;

  let rewardAmount = toDecimal(amount);

  // ✅ Update historical totals (this is accurate from contract events)
  nft.totalRewardsEarned = nft.totalRewardsEarned.plus(rewardAmount);
  nft.totalRewardsClaimed = nft.totalRewardsClaimed.plus(rewardAmount);

  // ✅ RESET calculation metadata after claim
  nft.pendingRewards = ZERO_BD; // Just claimed, so zero pending
  nft.claimableAmount = ZERO_BD;
  nft.lastRewardCalculation = timestamp; // New checkpoint for frontend
  nft.lastRewardUpdate = timestamp;
  nft.updatedAt = timestamp;
  nft.save();

  // Update user
  let userEntity = getOrCreateUser(user, timestamp);
  userEntity.totalRewardsClaimed =
    userEntity.totalRewardsClaimed.plus(rewardAmount);
  userEntity.totalRewardsEarned =
    userEntity.totalRewardsEarned.plus(rewardAmount);
  userEntity.save();

  // Create claim record
  let claimId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let claim = new RewardClaim(claimId);
  claim.nft = nftId;
  claim.user = user;
  claim.amount = rewardAmount;
  claim.timestamp = timestamp;
  claim.blockNumber = event.block.number;
  claim.transactionHash = event.transaction.hash;
  claim.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.totalRewardsDistributed =
    platformStats.totalRewardsDistributed.plus(rewardAmount);
  updatePlatformMetrics(timestamp);
}

export function handleRewardAdded(event: RewardAdded): void {
  let amount = event.params.amount;
  let newRewardRate = event.params.newRewardRate;
  let timestamp = event.block.timestamp;

  // ✅ CRITICAL: Store the new reward rate for frontend calculations
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.currentRewardRate = toDecimal(newRewardRate);
  platformStats.totalETHReceived = platformStats.totalETHReceived.plus(
    toDecimal(amount)
  );

  updatePlatformMetrics(timestamp);

  // ✅ Create a RewardRate snapshot for historical tracking
  let rateId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let rate = new RewardRate(rateId);
  rate.oldRate = platformStats.currentRewardRate; // Previous rate
  rate.newRate = toDecimal(newRewardRate);
  rate.timestamp = timestamp;
  rate.blockNumber = event.block.number;
  rate.transactionHash = event.transaction.hash;
  rate.save();
}

export function handleRewardRateUpdated(event: RewardRateUpdated): void {
  let oldRate = event.params.oldRate;
  let newRate = event.params.newRate;
  let timestamp = event.block.timestamp;

  // ✅ Store rate change snapshot
  let rateId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let rate = new RewardRate(rateId);
  rate.oldRate = toDecimal(oldRate);
  rate.newRate = toDecimal(newRate);
  rate.timestamp = timestamp;
  rate.blockNumber = event.block.number;
  rate.transactionHash = event.transaction.hash;
  rate.save();

  // Update platform stats with new rate
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.currentRewardRate = toDecimal(newRate);
  updatePlatformMetrics(timestamp);
}

export function handleETHReceived(event: ETHReceived): void {
  let from = event.params.from;
  let amount = event.params.amount;
  let timestamp = event.block.timestamp;

  // Create ETH received entity
  let ethId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let ethReceived = new ETHReceivedEntity(ethId);
  ethReceived.from = from;
  ethReceived.amount = toDecimal(amount);
  ethReceived.timestamp = timestamp;
  ethReceived.blockNumber = event.block.number;
  ethReceived.transactionHash = event.transaction.hash;
  ethReceived.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.totalETHReceived = platformStats.totalETHReceived.plus(
    toDecimal(amount)
  );
  updatePlatformMetrics(timestamp);
}

export function handleConfigurationInitialized(
  event: ConfigurationInitialized
): void {
  let config = new PlatformConfig(CONFIG_ID);

  config.minimumStakingPeriod = event.params.minimumStakingPeriod;
  config.baseAPR = event.params.baseAPR;
  config.performanceMultiplier = event.params.performanceMultiplier;
  config.rewardCalculationPeriod = BigInt.fromI32(86400); // 1 day default
  config.maxStakeAmount = BigInt.fromI32(0); // Unlimited
  config.emergencyWithdrawEnabled = event.params.emergencyWithdrawEnabled;
  config.lastConfigUpdate = event.params.timestamp;
  config.createdAt = event.block.timestamp;
  config.updatedAt = event.block.timestamp;

  config.save();
}

export function handleConfigurationUpdated(event: ConfigurationUpdated): void {
  let config = PlatformConfig.load(CONFIG_ID);

  if (!config) {
    config = new PlatformConfig(CONFIG_ID);
    config.createdAt = event.block.timestamp;
  }

  config.minimumStakingPeriod = event.params.minimumStakingPeriod;
  config.baseAPR = event.params.baseAPR;
  config.performanceMultiplier = event.params.performanceMultiplier;
  config.rewardCalculationPeriod = event.params.rewardCalculationPeriod;
  config.maxStakeAmount = event.params.maxStakeAmount;
  config.emergencyWithdrawEnabled = event.params.emergencyWithdrawEnabled;
  config.lastConfigUpdate = event.params.timestamp;
  config.updatedAt = event.block.timestamp;

  config.save();
}

export function handleMinimumStakingPeriodUpdated(
  event: MinimumStakingPeriodUpdated
): void {
  let config = PlatformConfig.load(CONFIG_ID);

  if (!config) {
    config = new PlatformConfig(CONFIG_ID);
    config.createdAt = event.block.timestamp;
  }

  config.minimumStakingPeriod = event.params.newPeriod;
  config.lastConfigUpdate = event.block.timestamp;
  config.updatedAt = event.block.timestamp;

  config.save();
}

export function handleBaseAPRUpdated(event: BaseAPRUpdated): void {
  let config = PlatformConfig.load(CONFIG_ID);

  if (!config) {
    config = new PlatformConfig(CONFIG_ID);
    config.createdAt = event.block.timestamp;
  }

  config.baseAPR = event.params.newAPR;
  config.lastConfigUpdate = event.block.timestamp;
  config.updatedAt = event.block.timestamp;

  config.save();
}

export function handleEmergencyWithdrawToggled(
  event: EmergencyWithdrawToggled
): void {
  let config = PlatformConfig.load(CONFIG_ID);

  if (!config) {
    config = new PlatformConfig(CONFIG_ID);
    config.createdAt = event.block.timestamp;
  }

  config.emergencyWithdrawEnabled = event.params.enabled;
  config.lastConfigUpdate = event.block.timestamp;
  config.updatedAt = event.block.timestamp;

  config.save();
}
