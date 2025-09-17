import { BigInt, BigDecimal, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  FounderNFTMinted,
  TokenStaked,
  TokenUnstaked,
  RewardClaimed,
  RewardRateUpdated,
  RewardAdded,
  ETHReceived,
  FounderNFT as FounderNFTContract,
} from "../generated/FounderNFT/FounderNFT";
import {
  User,
  FounderNFT,
  StakeEvent,
  PlatformStats,
  RewardClaim,
  RewardRate,
  ETHReceived as ETHReceivedEntity,
} from "../generated/schema";

// Constants
let ZERO_BI = BigInt.fromI32(0);
let ZERO_BD = BigDecimal.fromString("0");
let PLATFORM_ID = Bytes.fromHexString("0x706c6174666f726d");

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
    stats.lastUpdated = timestamp;
    stats.save();
  }
  return stats as PlatformStats;
}

function updateRewardsFromContract(
  nftId: Bytes,
  tokenId: BigInt,
  contractAddress: Address,
  timestamp: BigInt
): void {
  // Load the NFT entity
  let nft = FounderNFT.load(nftId);
  if (nft == null) return;

  // Only update if the token is currently staked
  if (!nft.isStaked) return;

  // Bind to the contract and get current earned rewards
  let contract = FounderNFTContract.bind(contractAddress);
  let earnedResult = contract.try_earned(tokenId);

  if (!earnedResult.reverted) {
    // Convert BigInt to BigDecimal (assuming 18 decimals)
    let earnedAmount = toDecimal(earnedResult.value);

    // Update the total rewards earned with real-time value from contract
    nft.totalRewardsEarned = earnedAmount;
    nft.lastRewardUpdate = timestamp;
    nft.updatedAt = timestamp;
    nft.save();

    // Log for debugging (optional)
    // log.info("Updated rewards for token {}: {} ETH", [tokenId.toString(), earnedAmount.toString()]);
  }
}

export function handleFounderNFTMinted(event: FounderNFTMinted): void {
  let tokenId = event.params.tokenId;
  let to = event.params.to;
  let timestamp = event.block.timestamp;

  // Create or get user
  let user = User.load(to);
  if (user == null) {
    user = new User(to);
    user.totalNFTsOwned = 0;
    user.totalNFTsStaked = 0;
    user.totalRewardsEarned = ZERO_BD;
    user.totalRewardsClaimed = ZERO_BD;
    user.firstInteraction = timestamp;
    user.createdAt = timestamp;
    user.updatedAt = timestamp;
    user.lastInteraction = timestamp;
  }
  user.totalNFTsOwned = user.totalNFTsOwned + 1;
  user.updatedAt = timestamp;
  user.lastInteraction = timestamp;
  user.save();

  // Create NFT entity
  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = new FounderNFT(nftId);
  nft.tokenId = tokenId;
  nft.currentOwner = to;
  nft.mintedBy = to;
  nft.isStaked = false;
  nft.currentStaker = null;
  nft.stakingSince = null;
  nft.totalRewardsEarned = ZERO_BD;
  nft.totalRewardsClaimed = ZERO_BD;
  nft.lastRewardUpdate = timestamp;
  nft.canUnstake = false;
  nft.nextUnstakeDate = null;
  nft.stakingDuration = ZERO_BI;
  nft.mintedAt = timestamp;
  nft.createdAt = timestamp;
  nft.updatedAt = timestamp;
  nft.save();
}

export function handleTokenStaked(event: TokenStaked): void {
  let tokenId = event.params.tokenId;
  let owner = event.params.owner;
  let timestamp = event.block.timestamp;

  // Create or load NFT entity
  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = FounderNFT.load(nftId);

  let isNewNFT = false; // Track if we're creating a new NFT

  if (nft == null) {
    // Create NFT entity if it doesn't exist (in case minting wasn't captured)
    nft = new FounderNFT(nftId);
    nft.tokenId = tokenId;
    nft.currentOwner = owner;
    nft.mintedBy = owner; // Assume same as current owner
    nft.totalRewardsEarned = ZERO_BD;
    nft.totalRewardsClaimed = ZERO_BD;
    nft.lastRewardUpdate = timestamp;
    nft.canUnstake = false;
    nft.nextUnstakeDate = null;
    nft.stakingDuration = ZERO_BI;
    nft.mintedAt = timestamp; // Best guess
    nft.createdAt = timestamp;

    isNewNFT = true; // Mark that this is a new NFT
  }

  // Update NFT staking status
  nft.isStaked = true;
  nft.currentStaker = owner;
  nft.stakingSince = timestamp;
  nft.canUnstake = false;
  nft.updatedAt = timestamp;
  nft.lastRewardUpdate = timestamp;

  // Update rewards from contract after staking
  updateRewardsFromContract(nftId, tokenId, event.address, timestamp);
  nft.save();

  // Update user
  let user = getOrCreateUser(owner, timestamp);
  user.totalNFTsStaked = user.totalNFTsStaked + 1;

  // If this is a new NFT (not previously tracked), increment totalNFTsOwned
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
  platformStats.save();
}

export function handleTokenUnstaked(event: TokenUnstaked): void {
  let tokenId = event.params.tokenId;
  let owner = event.params.owner;
  let timestamp = event.block.timestamp;

  // Load NFT
  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = FounderNFT.load(nftId);
  if (nft == null) return;

  //Update rewards from contract before unstaking
  updateRewardsFromContract(nftId, tokenId, event.address, timestamp);

  // Calculate staking duration - FIXED VERSION
  let stakingSinceValue = nft.stakingSince;
  if (stakingSinceValue !== null) {
    nft.stakingDuration = timestamp.minus(stakingSinceValue);
  } else {
    nft.stakingDuration = ZERO_BI;
  }

  // Update NFT staking status
  nft.isStaked = false;
  nft.currentStaker = null;
  nft.stakingSince = null;
  nft.canUnstake = false;
  nft.nextUnstakeDate = null;
  nft.updatedAt = timestamp;
  nft.lastRewardUpdate = timestamp;
  nft.save();

  // Update user
  let user = getOrCreateUser(owner, timestamp);
  user.totalNFTsStaked = user.totalNFTsStaked - 1;
  user.save();

  // Create stake event
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
  platformStats.save();
}

export function handleRewardClaimed(event: RewardClaimed): void {
  let user = event.params.user;
  let tokenId = event.params.tokenId;
  let amount = event.params.amount;
  let timestamp = event.block.timestamp;

  // Load NFT
  let nftId = Bytes.fromByteArray(Bytes.fromBigInt(tokenId));
  let nft = FounderNFT.load(nftId);
  if (nft == null) return;

  let rewardAmount = toDecimal(amount);

  // Update NFT rewards
  nft.totalRewardsClaimed = nft.totalRewardsClaimed.plus(rewardAmount);
  nft.updatedAt = timestamp;
  nft.lastRewardUpdate = timestamp;
  // Update current earned rewards from contract
  // After claiming, the earned amount should be much lower or zero
  updateRewardsFromContract(nftId, tokenId, event.address, timestamp);

  nft.save();

  // Update user rewards
  let userEntity = getOrCreateUser(user, timestamp);
  userEntity.totalRewardsClaimed =
    userEntity.totalRewardsClaimed.plus(rewardAmount);
  userEntity.save();

  // Create reward claim entity
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
  platformStats.save();
}

export function handleRewardRateUpdated(event: RewardRateUpdated): void {
  let oldRate = event.params.oldRate;
  let newRate = event.params.newRate;
  let timestamp = event.block.timestamp;

  // Create reward rate entity
  let rateId = event.block.number
    .toString()
    .concat("-")
    .concat(timestamp.toString());
  let rewardRate = new RewardRate(Bytes.fromUTF8(rateId));
  rewardRate.oldRate = toDecimal(oldRate);
  rewardRate.newRate = toDecimal(newRate);
  rewardRate.timestamp = timestamp;
  rewardRate.blockNumber = event.block.number;
  rewardRate.transactionHash = event.transaction.hash;
  rewardRate.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.currentRewardRate = toDecimal(newRate);
  platformStats.save();
}

export function handleRewardAdded(event: RewardAdded): void {
  let amount = event.params.amount;
  let newRewardRate = event.params.newRewardRate;
  let timestamp = event.block.timestamp;

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.currentRewardRate = toDecimal(newRewardRate);
  platformStats.save();
}

export function handleETHReceived(event: ETHReceived): void {
  let from = event.params.from;
  let amount = event.params.amount;
  let timestamp = event.block.timestamp;

  let ethAmount = toDecimal(amount);

  // Create ETH received entity
  let ethId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let ethReceived = new ETHReceivedEntity(ethId);
  ethReceived.from = from;
  ethReceived.amount = ethAmount;
  ethReceived.timestamp = timestamp;
  ethReceived.blockNumber = event.block.number;
  ethReceived.transactionHash = event.transaction.hash;
  ethReceived.save();

  // Update platform stats
  let platformStats = getOrCreatePlatformStats(timestamp);
  platformStats.totalETHReceived =
    platformStats.totalETHReceived.plus(ethAmount);
  platformStats.save();
}
