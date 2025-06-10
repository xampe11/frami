// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {FounderNFTStorage} from "./FounderNFTStorage.sol";

/**
 * @title ModernFounderNFT
 * @dev NFT for platform founders with continuous reward accrual system
 * @notice Implements Synthetix-style staking rewards with automatic distribution
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
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    // Reward system constants
    uint256 public constant SALES_REDISTRIBUTION_PERCENTAGE = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000; // 100%
    uint256 public constant PRECISION = 1e18; // For reward calculations

    // Events
    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event RewardAdded(uint256 amount, uint256 newRewardRate);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event ETHReceived(address indexed from, uint256 amount);

    /**
     * @dev Prevents initialization function from being called twice
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
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
     * @dev Modifier to update rewards before any staking operation
     */
    modifier updateReward(uint256 tokenId) {
        _rewardPerTokenStored = rewardPerToken();
        _lastUpdateTime = block.timestamp;

        if (tokenId != 0 && _stakedTokens[tokenId].owner != address(0)) {
            _rewards[tokenId] = earned(tokenId);
            _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;
        }
        _;
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @dev Calculate reward per token
     */
    function rewardPerToken() public view returns (uint256) {
        if (_totalStakedSupply == 0) {
            return _rewardPerTokenStored;
        }

        return
            _rewardPerTokenStored + ((block.timestamp - _lastUpdateTime) * _rewardRate * PRECISION / _totalStakedSupply);
    }

    /**
     * @dev Calculate earned rewards for a specific token
     */
    function earned(uint256 tokenId) public view returns (uint256) {
        if (_stakedTokens[tokenId].owner == address(0)) {
            return 0;
        }

        return (rewardPerToken() - _userRewardPerTokenPaid[tokenId]) * 1 / PRECISION + _rewards[tokenId];
    }

    /**
     * @dev Get total claimable rewards for a token
     */
    function getClaimableRewards(uint256 tokenId) external view returns (uint256) {
        return earned(tokenId);
    }

    /**
     * @dev Add rewards to the system (internal function)
     */
    function _addRewards(uint256 amount) internal updateReward(0) {
        if (_totalStakedSupply > 0) {
            // Distribute over time to prevent flash loan attacks
            uint256 rewardDuration = 86400; // 24 hours
            uint256 newRewardRate = amount / rewardDuration;
            _rewardRate += newRewardRate;

            emit RewardAdded(amount, _rewardRate);
            emit RewardRateUpdated(_rewardRate - newRewardRate, _rewardRate);
        } else {
            // No stakers yet, hold rewards for when staking begins
            _pendingRewards += amount;
        }
    }

    /**
     * @dev Mint a Founder NFT with automatic reward distribution
     */
    function mint() external payable nonReentrant {
        require(_saleActive, "Sale is not active");
        require(totalSupply() < _maxSupply, "Max supply reached");
        require(msg.value >= _price, "Insufficient payment");

        // Calculate redistribution amount (10% of sales)
        uint256 redistributionAmount = (msg.value * SALES_REDISTRIBUTION_PERCENTAGE) / BASIS_POINTS;
        uint256 salesProceedsAmount = msg.value - redistributionAmount;

        // Add to sales proceeds (90% of the payment)
        _totalSalesProceeds += salesProceedsAmount;

        // Immediately distribute 10% to current stakers
        if (redistributionAmount > 0) {
            _addRewards(redistributionAmount);
        }

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _mint(msg.sender, tokenId);

        emit FounderNFTMinted(msg.sender, tokenId);
    }

    /**
     * @dev Mint multiple Founder NFTs with automatic reward distribution
     */
    function mintMultiple(uint256 quantity) external payable nonReentrant {
        require(_saleActive, "Sale is not active");
        require(quantity > 0 && quantity <= 10, "Invalid quantity");
        require(totalSupply() + quantity <= _maxSupply, "Max supply exceeded");
        require(msg.value >= _price * quantity, "Insufficient payment");

        // Calculate redistribution for total payment
        uint256 redistributionAmount = (msg.value * SALES_REDISTRIBUTION_PERCENTAGE) / BASIS_POINTS;
        uint256 salesProceedsAmount = msg.value - redistributionAmount;

        _totalSalesProceeds += salesProceedsAmount;

        // Immediately distribute rewards
        if (redistributionAmount > 0) {
            _addRewards(redistributionAmount);
        }

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _mint(msg.sender, tokenId);
            emit FounderNFTMinted(msg.sender, tokenId);
        }
    }

    /**
     * @dev Batch mint multiple NFTs (for admin use) - NO PAYMENT REQUIRED
     */
    function batchMint(address[] memory recipients) external onlyRole(ADMIN_ROLE) {
        require(_saleActive, "Sale is not active");
        require(totalSupply() + recipients.length <= _maxSupply, "Exceeds max supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _mint(recipients[i], tokenId);

            emit FounderNFTMinted(recipients[i], tokenId);
        }
    }

    /**
     * @dev Add platform fees to reward system
     */
    function addPlatformFees(uint256 amount) external payable onlyRole(PLATFORM_ROLE) {
        uint256 rewardAmount = msg.value > 0 ? msg.value : amount;
        require(rewardAmount > 0, "No rewards to add");

        _addRewards(rewardAmount);
    }

    /**
     * @dev Stake token to participate in reward distribution
     */
    function stakeToken(uint256 tokenId) external nonReentrant updateReward(tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(_stakedTokens[tokenId].owner == address(0), "Token already staked");

        // Transfer token to this contract
        _transfer(msg.sender, address(this), tokenId);

        // Record staking information
        _stakedTokens[tokenId] =
            StakeInfo({owner: msg.sender, stakedSince: block.timestamp, lastRewardsClaimed: block.timestamp});

        _totalStakedSupply++;
        _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;

        // If this is the first staker and we have pending rewards, start distributing
        if (_totalStakedSupply == 1 && _pendingRewards > 0) {
            _addRewards(_pendingRewards);
            _pendingRewards = 0;
        }

        emit TokenStaked(msg.sender, tokenId);
    }

    /**
     * @dev Unstake token
     */
    function unstakeToken(uint256 tokenId) external nonReentrant updateReward(tokenId) {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");
        require(
            block.timestamp >= _stakedTokens[tokenId].stakedSince + _minimumStakingPeriod,
            "Minimum staking period not reached"
        );

        // Automatically claim rewards before unstaking
        uint256 reward = _rewards[tokenId];
        if (reward > 0) {
            _rewards[tokenId] = 0;
            (bool success,) = msg.sender.call{value: reward}("");
            require(success, "Reward transfer failed");
            emit RewardClaimed(msg.sender, tokenId, reward);
        }

        // Transfer token back to owner
        _transfer(address(this), msg.sender, tokenId);

        // Clear staking information
        delete _stakedTokens[tokenId];
        delete _userRewardPerTokenPaid[tokenId];

        _totalStakedSupply--;

        emit TokenUnstaked(msg.sender, tokenId);
    }

    /**
     * @dev Stake multiple tokens in a single transaction
     * @param tokenIds Array of token IDs to stake
     */
    function stakeMultipleTokens(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "No tokens to stake");
        require(tokenIds.length <= 20, "Too many tokens in single transaction"); // Prevent gas limit issues

        // Update global reward state once
        _rewardPerTokenStored = rewardPerToken();
        _lastUpdateTime = block.timestamp;

        uint256 newlyStaked = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            require(ownerOf(tokenId) == msg.sender, "Not the token owner");
            require(_stakedTokens[tokenId].owner == address(0), "Token already staked");

            // Transfer token to this contract
            _transfer(msg.sender, address(this), tokenId);

            // Record staking information
            _stakedTokens[tokenId] =
                StakeInfo({owner: msg.sender, stakedSince: block.timestamp, lastRewardsClaimed: block.timestamp});

            _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;
            newlyStaked++;

            emit TokenStaked(msg.sender, tokenId);
        }

        _totalStakedSupply += newlyStaked;

        // If this brings the first stakers and we have pending rewards, start distributing
        if (_totalStakedSupply == newlyStaked && _pendingRewards > 0) {
            _addRewards(_pendingRewards);
            _pendingRewards = 0;
        }
    }

    /**
     * @dev Unstake multiple tokens in a single transaction
     * @param tokenIds Array of token IDs to unstake
     */
    function unstakeMultipleTokens(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "No tokens to unstake");
        require(tokenIds.length <= 20, "Too many tokens in single transaction"); // Prevent gas limit issues

        // Update global reward state once
        _rewardPerTokenStored = rewardPerToken();
        _lastUpdateTime = block.timestamp;

        uint256 totalRewards = 0;
        uint256 unstaked = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");
            require(
                block.timestamp >= _stakedTokens[tokenId].stakedSince + _minimumStakingPeriod,
                "Minimum staking period not reached"
            );

            // Update and calculate rewards for this token
            _rewards[tokenId] = earned(tokenId);
            uint256 reward = _rewards[tokenId];

            if (reward > 0) {
                _rewards[tokenId] = 0;
                totalRewards += reward;
                emit RewardClaimed(msg.sender, tokenId, reward);
            }

            // Transfer token back to owner
            _transfer(address(this), msg.sender, tokenId);

            // Clear staking information
            delete _stakedTokens[tokenId];
            delete _userRewardPerTokenPaid[tokenId];

            unstaked++;
            emit TokenUnstaked(msg.sender, tokenId);
        }

        _totalStakedSupply -= unstaked;

        // Transfer all accumulated rewards in one transaction
        if (totalRewards > 0) {
            (bool success,) = msg.sender.call{value: totalRewards}("");
            require(success, "Reward transfer failed");
        }
    }

    /**
     * @dev Claim rewards for a specific token
     */
    function claimReward(uint256 tokenId) external nonReentrant updateReward(tokenId) {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");

        uint256 reward = _rewards[tokenId];
        require(reward > 0, "No rewards to claim");

        _rewards[tokenId] = 0;
        _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;

        (bool success,) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");

        emit RewardClaimed(msg.sender, tokenId, reward);
    }

    /**
     * @dev Claim rewards for multiple tokens
     */
    function claimMultipleRewards(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalReward = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");

            // Update rewards for this token
            _rewardPerTokenStored = rewardPerToken();
            _lastUpdateTime = block.timestamp;

            if (_stakedTokens[tokenId].owner != address(0)) {
                _rewards[tokenId] = earned(tokenId);
                _userRewardPerTokenPaid[tokenId] = _rewardPerTokenStored;
            }

            uint256 reward = _rewards[tokenId];
            if (reward > 0) {
                _rewards[tokenId] = 0;
                _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;
                totalReward += reward;
                emit RewardClaimed(msg.sender, tokenId, reward);
            }
        }

        require(totalReward > 0, "No rewards to claim");

        (bool success,) = msg.sender.call{value: totalReward}("");
        require(success, "Reward transfer failed");
    }

    /**
     * @dev Get current reward rate (ETH per second distributed to all stakers)
     */
    function getCurrentRewardRate() external view returns (uint256) {
        return _rewardRate;
    }

    /**
     * @dev Get total staked supply
     */
    function getTotalStakedSupply() external view returns (uint256) {
        return _totalStakedSupply;
    }

    /**
     * @dev Check if token is staked
     */
    function isTokenStaked(uint256 tokenId) external view returns (bool) {
        return _stakedTokens[tokenId].owner != address(0);
    }

    /**
     * @dev Get staking information for a token
     */
    function getStakingInfo(uint256 tokenId)
        external
        view
        returns (address owner, uint256 stakedSince, uint256 lastRewardsClaimed)
    {
        StakeInfo memory info = _stakedTokens[tokenId];
        return (info.owner, info.stakedSince, info.lastRewardsClaimed);
    }

    /**
     * @dev Get estimated APR for staking (approximate, based on recent reward rate)
     */
    function getEstimatedAPR() external view returns (uint256) {
        if (_totalStakedSupply == 0 || address(this).balance == 0) {
            return 0;
        }

        // Annual rewards at current rate
        uint256 annualRewards = _rewardRate * 365 days;

        // Total value staked (approximate as current contract balance / 2)
        uint256 totalStakedValue = address(this).balance / 2;

        if (totalStakedValue == 0) {
            return 0;
        }

        // APR = (annual rewards / total staked value) * 100
        return (annualRewards * 10000) / totalStakedValue; // Return in basis points
    }

    // ===== EXISTING FUNCTIONS (updated to remove epoch dependencies) =====

    function isFounder(address account) external view returns (bool) {
        return balanceOf(account) > 0;
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

    function setMinimumStakingPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        _minimumStakingPeriod = newPeriod;
    }

    function hasEarlyAccess(address account, address projectAddress) external view returns (bool) {
        return balanceOf(account) > 0 && _earlyAccessProjects[projectAddress];
    }

    function addEarlyAccessProject(address projectAddress) external onlyRole(ADMIN_ROLE) {
        _earlyAccessProjects[projectAddress] = true;
        emit EarlyAccessProjectAdded(projectAddress);
    }

    function removeEarlyAccessProject(address projectAddress) external onlyRole(ADMIN_ROLE) {
        _earlyAccessProjects[projectAddress] = false;
        emit EarlyAccessProjectRemoved(projectAddress);
    }

    function getDaoTokenAllocationPercentage() external view returns (uint256) {
        return _daoTokenAllocationPercentage;
    }

    function setPlatformFeeDistributionPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        require(newPercentage <= 10000, "Invalid percentage");
        _platformFeeDistributionPercentage = newPercentage;
    }

    function setDaoTokenAllocationPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        require(newPercentage <= 10000, "Invalid percentage");
        _daoTokenAllocationPercentage = newPercentage;
    }

    function setSaleStatus(bool status) external onlyRole(ADMIN_ROLE) {
        _saleActive = status;
    }

    function getSaleStatus() external view returns (bool) {
        return _saleActive;
    }

    function setPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) {
        _price = newPrice;
    }

    function getPrice() external view returns (uint256) {
        return _price;
    }

    function getMaxSupply() external view returns (uint256) {
        return _maxSupply;
    }

    function withdrawSalesProceeds() external onlyRole(ADMIN_ROLE) {
        uint256 amount = _totalSalesProceeds;
        require(amount > 0, "No sales proceeds to withdraw");

        _totalSalesProceeds = 0;

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(super.tokenURI(tokenId), "/founder"));
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721EnumerableUpgradeable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            require(
                _stakedTokens[tokenId].owner == address(0) || from == address(this) || to == address(this),
                "Cannot transfer staked token"
            );
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Emergency function to adjust reward rate (admin only)
     */
    function setRewardRate(uint256 newRate) external onlyRole(ADMIN_ROLE) updateReward(0) {
        uint256 oldRate = _rewardRate;
        _rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @dev Withdraw excess ETH (excludes staking rewards)
     */
    function withdraw() external onlyRole(ADMIN_ROLE) {
        // Calculate total pending rewards
        uint256 totalPendingRewards = _pendingRewards;

        // Add up all individual token rewards
        for (uint256 i = 0; i < totalSupply(); i++) {
            uint256 tokenId = tokenByIndex(i);
            if (_stakedTokens[tokenId].owner != address(0)) {
                totalPendingRewards += earned(tokenId);
            }
        }

        uint256 withdrawable = address(this).balance - totalPendingRewards;
        require(withdrawable > 0, "No withdrawable funds");

        (bool success,) = msg.sender.call{value: withdrawable}("");
        require(success, "Transfer failed");
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
