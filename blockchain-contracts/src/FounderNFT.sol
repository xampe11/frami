// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// 1. Imports (explicit imports following modern practices)
import {ERC721EnumerableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {FounderNFTStorage} from "./FounderNFTStorage.sol";

// 2. Errors (custom errors following ERC-6093 specification)
error SaleNotActive();
error MaxSupplyReached();
error InsufficientPayment(uint256 required, uint256 provided);
error InvalidQuantity(uint256 provided, uint256 max);
error TokenNotOwned(uint256 tokenId, address caller);
error TokenAlreadyStaked(uint256 tokenId);
error TokenNotStaked(uint256 tokenId);
error MinimumStakingPeriodNotMet(uint256 tokenId, uint256 timeRemaining);
error NoRewardsToAdd();
error NoRewardsToClaim();
error NoStakedTokens();
error TooManyTokensInTransaction(uint256 provided, uint256 max);
error TransferFailed();
error InvalidOwnerAddress();
error InvalidPercentage(uint256 provided);
error NoSalesProceedsToWithdraw();
error NoWithdrawableFunds();
error CannotTransferStakedToken(uint256 tokenId);

// 3. Interfaces
// None required for this contract

// 4. Libraries
// Using libraries declared in contract

/**
 * @title ModernFounderNFT
 * @author Frami Development Team
 * @notice NFT for platform founders with continuous reward accrual system
 * @dev Implements Synthetix-style staking rewards with automatic distribution
 */
contract FounderNFT is
    Initializable,
    FounderNFTStorage,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // 1. Type declarations
    // (Already defined in FounderNFTStorage)

    // 2. State variables (constants and immutables)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    uint256 public constant SALES_REDISTRIBUTION_PERCENTAGE = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000; // 100%
    uint256 public constant PRECISION = 1e18; // For reward calculations
    uint256 private constant REWARD_DURATION = 604800; // 7 days (7 * 24 * 60 * 60)
    uint256 private constant MAX_BATCH_SIZE = 20; // Maximum tokens per batch operation

    // 3. Events
    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event RewardAdded(uint256 amount, uint256 newRewardRate);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event ETHReceived(address indexed from, uint256 amount);

    // 4. Modifiers
    /**
     * @dev Updates rewards incrementally (for ongoing operations)
     * @param tokenId The token ID to update rewards for (type(uint256).max for global-only update)
     */
    modifier updateRewardIncremental(uint256 tokenId) {
        uint256 newRewardPerToken = rewardPerToken();

        // Use max uint256 as sentinel value instead of 0
        if (tokenId != type(uint256).max && _stakedTokens[tokenId].owner != address(0)) {
            uint256 rewardPerTokenDiff = newRewardPerToken - _userRewardPerTokenPaid[tokenId];
            _rewards[tokenId] += rewardPerTokenDiff / PRECISION;
            _userRewardPerTokenPaid[tokenId] = newRewardPerToken;
        }

        _rewardPerTokenStored = newRewardPerToken;
        _lastUpdateTime = block.timestamp;
        _;
    }

    /**
     * @dev Updates rewards completely (for settlement operations)
     * @param tokenId The token ID to update rewards for (type(uint256).max for global-only update)
     */
    modifier updateRewardComplete(uint256 tokenId) {
        uint256 newRewardPerToken = rewardPerToken();

        // Use max uint256 as sentinel value instead of 0
        if (tokenId != type(uint256).max && _stakedTokens[tokenId].owner != address(0)) {
            // For settlement: set TOTAL rewards, not incremental
            _rewards[tokenId] = earned(tokenId);
            _userRewardPerTokenPaid[tokenId] = newRewardPerToken;
        }

        _rewardPerTokenStored = newRewardPerToken;
        _lastUpdateTime = block.timestamp;
        _;
    }

    // 5. Functions

    // Constructor
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // Receive function
    /**
     * @dev Function to receive ETH
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    // External functions

    /**
     * @notice Initializes the FounderNFT contract
     * @dev Sets up all contract parameters and access controls
     * @param initialOwner The initial owner of the contract
     * @param platformRegistry The platform registry address
     * @param maxSupply Maximum number of NFTs that can be minted
     * @param price Price per NFT in wei
     * @param platformFeeDistributionPercentage Percentage of platform fees distributed
     * @param daoTokenAllocationPercentage Percentage allocated to DAO tokens
     * @param minimumStakingPeriod Minimum time tokens must be staked
     */
    function initialize(
        address initialOwner,
        address platformRegistry,
        uint256 maxSupply,
        uint256 price,
        uint256 platformFeeDistributionPercentage,
        uint256 daoTokenAllocationPercentage,
        uint256 minimumStakingPeriod
    ) external initializer {
        __ERC721_init("Frami Founder", "FRAMI");
        __ERC721Enumerable_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _platformRegistry = platformRegistry;
        _maxSupply = maxSupply;
        _price = price;
        _platformFeeDistributionPercentage = platformFeeDistributionPercentage;
        _daoTokenAllocationPercentage = daoTokenAllocationPercentage;
        _minimumStakingPeriod = minimumStakingPeriod;
        _nextTokenId = 0;

        // Initialize continuous reward system
        _lastUpdateTime = block.timestamp;
        _rewardPerTokenStored = 0;
        _totalStakedSupply = 0;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(PLATFORM_ROLE, platformRegistry);
    }

    /**
     * @notice Mint a single Founder NFT
     * @dev Automatically distributes 10% of payment to current stakers
     */
    function mint() external payable nonReentrant {
        if (!_saleActive) revert SaleNotActive();
        if (totalSupply() >= _maxSupply) revert MaxSupplyReached();
        if (msg.value < _price) revert InsufficientPayment(_price, msg.value);

        _processMintPayment(msg.value);
        _mintToken(msg.sender);
    }

    /**
     * @notice Mint multiple Founder NFTs in a single transaction
     * @dev More gas efficient than multiple single mints
     * @param quantity Number of NFTs to mint (max 10)
     */
    function mintMultiple(uint256 quantity) external payable nonReentrant {
        if (!_saleActive) revert SaleNotActive();
        if (quantity == 0 || quantity > 10) revert InvalidQuantity(quantity, 10);
        if (totalSupply() + quantity > _maxSupply) revert MaxSupplyReached();

        uint256 totalCost = _price * quantity;
        if (msg.value < totalCost) revert InsufficientPayment(totalCost, msg.value);

        _processMintPayment(msg.value);

        for (uint256 i = 0; i < quantity;) {
            _mintToken(msg.sender);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Admin function to batch mint NFTs to multiple recipients
     * @dev No payment required, admin only
     * @param recipients Array of addresses to receive NFTs
     */
    function batchMint(address[] memory recipients) external onlyRole(ADMIN_ROLE) {
        if (!_saleActive) revert SaleNotActive();
        if (totalSupply() + recipients.length > _maxSupply) revert MaxSupplyReached();

        uint256 length = recipients.length;
        for (uint256 i = 0; i < length;) {
            _mintToken(recipients[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Add platform fees to the reward system
     * @dev Only callable by platform contracts
     * @param amount Amount of rewards to add (if no ETH sent)
     */
    function addPlatformFees(uint256 amount)
        external
        payable
        onlyRole(PLATFORM_ROLE)
        updateRewardIncremental(type(uint256).max)
    {
        uint256 rewardAmount = msg.value > 0 ? msg.value : amount;
        if (rewardAmount == 0) revert NoRewardsToAdd();

        _addRewards(rewardAmount);
    }

    /**
     * @notice Stake a single NFT to earn rewards
     * @dev Transfers NFT to contract and starts reward accrual
     * @param tokenId The ID of the token to stake
     */
    function stakeToken(uint256 tokenId) external nonReentrant updateRewardIncremental(tokenId) {
        if (ownerOf(tokenId) != msg.sender) revert TokenNotOwned(tokenId, msg.sender);
        if (_stakedTokens[tokenId].owner != address(0)) revert TokenAlreadyStaked(tokenId);

        _stakeToken(msg.sender, tokenId);
    }

    /**
     * @notice Stake multiple NFTs in a single transaction
     * @dev More gas efficient than multiple single stakes
     * @param tokenIds Array of token IDs to stake
     */
    function stakeMultipleTokens(uint256[] calldata tokenIds)
        external
        nonReentrant
        updateRewardIncremental(type(uint256).max)
    {
        uint256 length = tokenIds.length;
        if (length == 0) revert NoStakedTokens();
        if (length > MAX_BATCH_SIZE) revert TooManyTokensInTransaction(length, MAX_BATCH_SIZE);

        uint256 newlyStaked = 0;
        for (uint256 i = 0; i < length;) {
            uint256 tokenId = tokenIds[i];

            if (ownerOf(tokenId) != msg.sender) revert TokenNotOwned(tokenId, msg.sender);
            if (_stakedTokens[tokenId].owner != address(0)) revert TokenAlreadyStaked(tokenId);

            //Transfer NFT to contract BEFORE updating state
            _transfer(msg.sender, address(this), tokenId);

            _stakeTokenInternal(msg.sender, tokenId);
            unchecked {
                ++newlyStaked;
            }
            unchecked {
                ++i;
            }
        }

        _totalStakedSupply += newlyStaked;
        _distributeInitialRewards();
    }

    /**
     * @notice Unstake a single NFT and claim rewards
     * @dev Automatically claims all pending rewards
     * @param tokenId The ID of the token to unstake
     */
    function unstakeToken(uint256 tokenId) external nonReentrant updateRewardComplete(tokenId) {
        if (_stakedTokens[tokenId].owner != msg.sender) revert TokenNotStaked(tokenId);

        uint256 timeStaked = block.timestamp - _stakedTokens[tokenId].stakedSince;
        if (timeStaked < _minimumStakingPeriod) {
            revert MinimumStakingPeriodNotMet(tokenId, _minimumStakingPeriod - timeStaked);
        }

        _unstakeToken(msg.sender, tokenId);
    }

    /**
     * @notice Unstake multiple NFTs in a single transaction
     * @dev Claims all rewards and returns all NFTs
     * @param tokenIds Array of token IDs to unstake
     */
    function unstakeMultipleTokens(uint256[] calldata tokenIds)
        external
        nonReentrant
        updateRewardComplete(type(uint256).max)
    {
        uint256 length = tokenIds.length;
        if (length == 0) revert NoStakedTokens();
        if (length > MAX_BATCH_SIZE) revert TooManyTokensInTransaction(length, MAX_BATCH_SIZE);

        uint256 totalRewards = 0;
        uint256 unstaked = 0;

        for (uint256 i = 0; i < length;) {
            uint256 tokenId = tokenIds[i];

            if (_stakedTokens[tokenId].owner != msg.sender) revert TokenNotStaked(tokenId);

            uint256 timeStaked = block.timestamp - _stakedTokens[tokenId].stakedSince;
            if (timeStaked < _minimumStakingPeriod) {
                revert MinimumStakingPeriodNotMet(tokenId, _minimumStakingPeriod - timeStaked);
            }

            // Calculate and accumulate rewards
            uint256 reward = earned(tokenId);
            if (reward > 0) {
                totalRewards += reward;
                emit RewardClaimed(msg.sender, tokenId, reward);
            }

            // Clear staking data before transfer
            delete _stakedTokens[tokenId];
            delete _userRewardPerTokenPaid[tokenId];
            delete _rewards[tokenId];

            // Transfer NFT back to owner
            _transfer(address(this), msg.sender, tokenId);

            emit TokenUnstaked(msg.sender, tokenId);
            unchecked {
                ++unstaked;
                ++i;
            }
        }

        // Clean up the user staked tokens array after all unstaking is complete
        // This prevents array manipulation issues during the loop
        uint256[] storage userTokens = _userStakedTokens[msg.sender];
        for (uint256 i = 0; i < length;) {
            uint256 tokenId = tokenIds[i];

            // Find and remove the token from the array
            for (uint256 j = 0; j < userTokens.length; j++) {
                if (userTokens[j] == tokenId) {
                    // Move last element to this position and pop
                    userTokens[j] = userTokens[userTokens.length - 1];
                    userTokens.pop();
                    delete _userStakedTokenIndex[msg.sender][tokenId];
                    break;
                }
            }
            unchecked {
                ++i;
            }
        }

        _totalStakedSupply -= unstaked;

        if (totalRewards > 0) {
            _transferRewards(msg.sender, totalRewards);
        }
    }

    /**
     * @notice Claim rewards for a single staked NFT
     * @dev NFT remains staked, only rewards are claimed
     * @param tokenId The ID of the token to claim rewards for
     */
    function claimReward(uint256 tokenId) external nonReentrant updateRewardComplete(tokenId) {
        if (_stakedTokens[tokenId].owner != msg.sender) revert TokenNotStaked(tokenId);

        uint256 reward = _rewards[tokenId];
        if (reward == 0) revert NoRewardsToClaim();

        // Update user state
        _rewards[tokenId] = 0;
        _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;

        _transferRewards(msg.sender, reward);
        emit RewardClaimed(msg.sender, tokenId, reward);
    }

    /**
     * @notice Claim rewards for multiple staked NFTs
     * @dev More gas efficient than multiple single claims
     * @param tokenIds Array of token IDs to claim rewards for
     */
    function claimMultipleRewards(uint256[] calldata tokenIds)
        external
        nonReentrant
        updateRewardComplete(type(uint256).max)
    {
        uint256 length = tokenIds.length;
        uint256 totalReward = 0;

        for (uint256 i = 0; i < length;) {
            uint256 tokenId = tokenIds[i];
            if (_stakedTokens[tokenId].owner != msg.sender) revert TokenNotStaked(tokenId);

            _rewards[tokenId] = earned(tokenId);
            _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;

            uint256 reward = _rewards[tokenId];
            if (reward > 0) {
                _rewards[tokenId] = 0;
                _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;
                totalReward += reward;
                emit RewardClaimed(msg.sender, tokenId, reward);
            }

            unchecked {
                ++i;
            }
        }

        if (totalReward == 0) revert NoRewardsToClaim();
        _transferRewards(msg.sender, totalReward);
    }

    /**
     * @notice Claim rewards for all staked tokens owned by caller
     * @dev Convenient function to claim all rewards at once
     */
    function claimAllRewards() external nonReentrant updateRewardComplete(type(uint256).max) {
        address owner = msg.sender;
        uint256[] memory stakedTokens = _userStakedTokens[owner];
        if (stakedTokens.length == 0) revert NoStakedTokens();

        uint256 totalRewards = 0;
        uint256 length = stakedTokens.length;

        for (uint256 i = 0; i < length;) {
            uint256 tokenId = stakedTokens[i];

            _rewards[tokenId] = earned(tokenId);
            _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;

            uint256 reward = _rewards[tokenId];
            if (reward > 0) {
                _rewards[tokenId] = 0;
                _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;
                totalRewards += reward;
                emit RewardClaimed(owner, tokenId, reward);
            }

            unchecked {
                ++i;
            }
        }

        if (totalRewards > 0) {
            _transferRewards(owner, totalRewards);
        }
    }

    // External view functions

    /**
     * @notice Calculate current reward per token
     * @dev Returns the accumulated reward per staked token
     * @return Current reward per token in wei
     */
    function rewardPerToken() public view returns (uint256) {
        if (_totalStakedSupply == 0) {
            return _rewardPerTokenStored;
        }

        return
            _rewardPerTokenStored + ((block.timestamp - _lastUpdateTime) * _rewardRate * PRECISION / _totalStakedSupply);
    }

    /**
     * @notice Calculate earned rewards for a specific token
     * @dev Returns pending rewards that can be claimed
     * @param tokenId The token ID to check
     * @return Amount of rewards earned in wei
     */
    function earned(uint256 tokenId) public view returns (uint256) {
        if (_stakedTokens[tokenId].owner == address(0)) {
            return 0;
        }

        return (rewardPerToken() - _userRewardPerTokenPaid[tokenId]) / PRECISION + _rewards[tokenId];
    }

    /**
     * @notice Get all staked token IDs for a specific owner
     * @dev Gas-efficient O(1) lookup
     * @param owner The address to query staked tokens for
     * @return Array of token IDs that are currently staked by the owner
     */
    function getStakedByOwner(address owner) external view returns (uint256[] memory) {
        if (owner == address(0)) revert InvalidOwnerAddress();
        return _userStakedTokens[owner];
    }

    /**
     * @notice Get count of staked tokens for an owner
     * @dev O(1) lookup operation
     * @param owner The address to check
     * @return Number of tokens staked by the owner
     */
    function getStakedCountByOwner(address owner) external view returns (uint256) {
        return _userStakedTokens[owner].length;
    }

    /**
     * @notice Check if an owner has any staked tokens
     * @dev O(1) lookup operation
     * @param owner The address to check
     * @return True if owner has staked tokens
     */
    function hasStakedTokens(address owner) external view returns (bool) {
        return _userStakedTokens[owner].length > 0;
    }

    /**
     * @notice Get total rewards earned across all staked tokens for an owner
     * @dev Calculates pending rewards for all owner's staked tokens
     * @param owner The address to calculate total rewards for
     * @return Total earned rewards in wei
     */
    function getTotalEarnedByOwner(address owner) external view returns (uint256) {
        uint256[] memory stakedTokens = _userStakedTokens[owner];
        uint256 totalEarned = 0;
        uint256 length = stakedTokens.length;

        for (uint256 i = 0; i < length;) {
            totalEarned += earned(stakedTokens[i]);
            unchecked {
                ++i;
            }
        }

        return totalEarned;
    }

    /**
     * @notice Get estimated APR for staking
     * @dev Approximate calculation based on current reward rate
     * @return APR in basis points (e.g., 500 = 5%)
     */
    function getEstimatedAPR() external view returns (uint256) {
        if (_totalStakedSupply == 0 || address(this).balance == 0) {
            return 0;
        }

        uint256 annualRewards = _rewardRate * 365 days;
        uint256 totalStakedValue = address(this).balance / 2;

        if (totalStakedValue == 0) {
            return 0;
        }

        return (annualRewards * BASIS_POINTS) / totalStakedValue;
    }

    /**
     * @notice Get staking info for multiple tokens at once
     * @dev Batch operation for frontend efficiency
     * @param tokenIds Array of token IDs to query
     * @return owners Array of owner addresses
     * @return stakedAt Array of staking timestamps
     * @return earnedRewards Array of earned rewards
     * @return canUnstake Array of unstaking eligibility
     */
    function getStakingInfoBatch(uint256[] calldata tokenIds)
        external
        view
        returns (
            address[] memory owners,
            uint256[] memory stakedAt,
            uint256[] memory earnedRewards,
            bool[] memory canUnstake
        )
    {
        uint256 length = tokenIds.length;
        owners = new address[](length);
        stakedAt = new uint256[](length);
        earnedRewards = new uint256[](length);
        canUnstake = new bool[](length);

        for (uint256 i = 0; i < length;) {
            uint256 tokenId = tokenIds[i];
            owners[i] = _stakedTokens[tokenId].owner;
            stakedAt[i] = _stakedTokens[tokenId].stakedSince;
            earnedRewards[i] = earned(tokenId);
            canUnstake[i] = (
                _stakedTokens[tokenId].owner != address(0)
                    && block.timestamp >= _stakedTokens[tokenId].stakedSince + _minimumStakingPeriod
            );

            unchecked {
                ++i;
            }
        }
    }

    // Additional view functions (getters)

    function getCurrentRewardRate() external view returns (uint256) {
        return _rewardRate;
    }

    function getRewards(uint256 tokenId) external view returns (uint256) {
        return _rewards[tokenId];
    }

    function getUserRewardPerTokenPaid(uint256 tokenId) external view returns (uint256) {
        return _userRewardPerTokenPaid[tokenId];
    }

    function getRewardPerTokenStored() external view returns (uint256) {
        return _rewardPerTokenStored;
    }

    function getLastUpdateTime() external view returns (uint256) {
        return _lastUpdateTime;
    }

    function getTotalStakedSupply() external view returns (uint256) {
        return _totalStakedSupply;
    }

    function isTokenStaked(uint256 tokenId) external view returns (bool) {
        return _stakedTokens[tokenId].owner != address(0);
    }

    /**
     * @notice Check if an address is a founder (owns or has staked NFTs)
     * @dev Returns true if the address owns NFTs directly OR has staked NFTs
     * @param account The address to check
     * @return True if the account is a founder
     */
    function isFounder(address account) external view returns (bool) {
        // Check if they currently own any NFTs
        if (balanceOf(account) > 0) {
            return true;
        }

        // Check if they have any staked NFTs
        return _userStakedTokens[account].length > 0;
    }

    function getPlatformFeeDistributionPercentage() external view returns (uint256) {
        return _platformFeeDistributionPercentage;
    }

    function getTotalSalesProceeds() external view returns (uint256) {
        return _totalSalesProceeds;
    }

    function getSalesRedistributionPercentage() external pure returns (uint256) {
        return SALES_REDISTRIBUTION_PERCENTAGE;
    }

    function getMinimumStakingPeriod() external view returns (uint256) {
        return _minimumStakingPeriod;
    }

    function getDaoTokenAllocationPercentage() external view returns (uint256) {
        return _daoTokenAllocationPercentage;
    }

    function getSaleStatus() external view returns (bool) {
        return _saleActive;
    }

    function getPrice() external view returns (uint256) {
        return _price;
    }

    function getMaxSupply() external view returns (uint256) {
        return _maxSupply;
    }

    // Admin functions
    function setMinimumStakingPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        _minimumStakingPeriod = newPeriod;
    }

    function setPlatformFeeDistributionPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        if (newPercentage > BASIS_POINTS) revert InvalidPercentage(newPercentage);
        _platformFeeDistributionPercentage = newPercentage;
    }

    function setDaoTokenAllocationPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        if (newPercentage > BASIS_POINTS) revert InvalidPercentage(newPercentage);
        _daoTokenAllocationPercentage = newPercentage;
    }

    function setSaleStatus(bool status) external onlyRole(ADMIN_ROLE) {
        _saleActive = status;
    }

    function setPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) {
        _price = newPrice;
    }

    function setRewardRate(uint256 newRate) external onlyRole(ADMIN_ROLE) updateRewardIncremental(type(uint256).max) {
        uint256 oldRate = _rewardRate;
        _rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    function addEarlyAccessProject(address projectAddress) external onlyRole(ADMIN_ROLE) {
        _earlyAccessProjects[projectAddress] = true;
        emit EarlyAccessProjectAdded(projectAddress);
    }

    function removeEarlyAccessProject(address projectAddress) external onlyRole(ADMIN_ROLE) {
        _earlyAccessProjects[projectAddress] = false;
        emit EarlyAccessProjectRemoved(projectAddress);
    }

    function withdrawSalesProceeds() external onlyRole(ADMIN_ROLE) {
        uint256 amount = _totalSalesProceeds;
        if (amount == 0) revert NoSalesProceedsToWithdraw();

        _totalSalesProceeds = 0;
        _transferRewards(msg.sender, amount);
    }

    function withdraw() external onlyRole(ADMIN_ROLE) {
        uint256 totalPendingRewards = _pendingRewards;
        uint256 supply = totalSupply();

        for (uint256 i = 0; i < supply;) {
            uint256 tokenId = tokenByIndex(i);
            if (_stakedTokens[tokenId].owner != address(0)) {
                totalPendingRewards += earned(tokenId);
            }
            unchecked {
                ++i;
            }
        }

        uint256 withdrawable = address(this).balance - totalPendingRewards;
        if (withdrawable == 0) revert NoWithdrawableFunds();

        _transferRewards(msg.sender, withdrawable);
    }

    // Public functions
    function hasEarlyAccess(address account, address projectAddress) public view returns (bool) {
        return balanceOf(account) > 0 && _earlyAccessProjects[projectAddress];
    }

    function getStakingInfo(uint256 tokenId)
        public
        view
        returns (address owner, uint256 stakedSince, uint256 lastRewardsClaimed)
    {
        StakeInfo memory info = _stakedTokens[tokenId];
        return (info.owner, info.stakedSince, info.lastRewardsClaimed);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(super.tokenURI(tokenId), "/founder"));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Internal functions
    function _addRewards(uint256 amount) internal {
        if (_totalStakedSupply > 0) {
            uint256 newRewardRate = amount / REWARD_DURATION;
            _rewardRate += newRewardRate;

            emit RewardAdded(amount, _rewardRate);
            emit RewardRateUpdated(_rewardRate - newRewardRate, _rewardRate);
        } else {
            _pendingRewards += amount;
        }
    }

    function _processMintPayment(uint256 payment) internal {
        uint256 redistributionAmount = (payment * SALES_REDISTRIBUTION_PERCENTAGE) / BASIS_POINTS;
        uint256 salesProceedsAmount = payment - redistributionAmount;

        _totalSalesProceeds += salesProceedsAmount;

        if (redistributionAmount > 0) {
            _addRewards(redistributionAmount);
        }
    }

    function _mintToken(address to) internal {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _mint(to, tokenId);
        emit FounderNFTMinted(to, tokenId);
    }

    function _stakeToken(address owner, uint256 tokenId) internal {
        _transfer(owner, address(this), tokenId);
        _stakeTokenInternal(owner, tokenId);
        _totalStakedSupply++;
        _distributeInitialRewards();
    }

    function _stakeTokenInternal(address owner, uint256 tokenId) internal {
        _stakedTokens[tokenId] =
            StakeInfo({owner: owner, stakedSince: block.timestamp, lastRewardsClaimed: block.timestamp});

        // CRITICAL: Use the UPDATED _rewardPerTokenStored value
        _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;
        _userStakedTokens[owner].push(tokenId);
        _userStakedTokenIndex[owner][tokenId] = _userStakedTokens[owner].length - 1;

        emit TokenStaked(owner, tokenId);
    }

    function _unstakeToken(address owner, uint256 tokenId) internal {
        uint256 reward = _rewards[tokenId];
        if (reward > 0) {
            _rewards[tokenId] = 0;
            _transferRewards(owner, reward);
            emit RewardClaimed(owner, tokenId, reward);
        }

        _transfer(address(this), owner, tokenId);
        _removeFromUserStakedTokens(owner, tokenId);
        _clearStakingData(tokenId);
        _totalStakedSupply--;

        emit TokenUnstaked(owner, tokenId);
    }

    function _unstakeTokenInternal(address owner, uint256 tokenId) internal returns (uint256) {
        _rewards[tokenId] = earned(tokenId);
        uint256 reward = _rewards[tokenId];

        if (reward > 0) {
            _rewards[tokenId] = 0;
            emit RewardClaimed(owner, tokenId, reward);
        }

        // CRITICAL FIX: Clear staking data BEFORE transferring the NFT
        // This prevents _update from seeing the token as staked during transfer
        _removeFromUserStakedTokens(owner, tokenId);
        _clearStakingData(tokenId);

        // Now safe to transfer since _stakedTokens[tokenId].owner is now address(0)
        _transfer(address(this), owner, tokenId);

        emit TokenUnstaked(owner, tokenId);
        return reward;
    }

    function _removeFromUserStakedTokens(address owner, uint256 tokenId) internal {
        uint256 tokenIndex = _userStakedTokenIndex[owner][tokenId];
        uint256 lastTokenIndex = _userStakedTokens[owner].length - 1;

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _userStakedTokens[owner][lastTokenIndex];
            _userStakedTokens[owner][tokenIndex] = lastTokenId;
            _userStakedTokenIndex[owner][lastTokenId] = tokenIndex;
        }

        _userStakedTokens[owner].pop();
        delete _userStakedTokenIndex[owner][tokenId];
    }

    function _clearStakingData(uint256 tokenId) internal {
        delete _stakedTokens[tokenId];
        delete _userRewardPerTokenPaid[tokenId];
    }

    function _distributeInitialRewards() internal {
        if (_totalStakedSupply == 1 && _pendingRewards > 0) {
            _addRewards(_pendingRewards);
            _pendingRewards = 0;
        }
    }

    function _transferRewards(address to, uint256 amount) internal {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721EnumerableUpgradeable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            if (_stakedTokens[tokenId].owner != address(0) && from != address(this) && to != address(this)) {
                revert CannotTransferStakedToken(tokenId);
            }
        }

        return super._update(to, tokenId, auth);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // Private functions
    // (None required for this contract)
}
