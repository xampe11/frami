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
 * @title FounderNFT
 * @dev NFT for platform founders with special privileges and weekly reward epochs
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

    // Weekly epoch constants
    uint256 public constant WEEK = 7 days;
    uint256 public constant SALES_REDISTRIBUTION_PERCENTAGE = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // Events
    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event WeeklyEpochFinalized(uint256 indexed week, uint256 totalRewards, uint256 stakedCount);
    event WeeklyRewardClaimed(address indexed user, uint256 indexed tokenId, uint256 indexed week, uint256 amount);
    event SalesRedistributed(uint256 amount);
    event SaleProceedsReceived(uint256 amount);
    event FeeDistributionReceived(uint256 amount);
    event EarlyAccessProjectAdded(address indexed projectAddress);
    event EarlyAccessProjectRemoved(address indexed projectAddress);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
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
        _totalStakedTokens = 0;

        // Initialize weekly system
        _deploymentWeek = getCurrentWeek();
        _currentWeeklyRewards = 0;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(PLATFORM_ROLE, platformRegistry);
    }

    /**
     * @dev Get current week number since epoch
     */
    function getCurrentWeek() public view returns (uint256) {
        return block.timestamp / WEEK;
    }

    /**
     * @dev Get week number for a specific timestamp
     */
    function getWeekOf(uint256 timestamp) public pure returns (uint256) {
        return timestamp / WEEK;
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @dev Mint a Founder NFT with weekly sales redistribution
     */
    function mint() external payable {
        require(_saleActive, "Sale is not active");
        require(totalSupply() < _maxSupply, "Max supply reached");
        require(msg.value >= _price, "Insufficient payment");

        // Calculate redistribution amount (10% of sales)
        uint256 redistributionAmount = (msg.value * SALES_REDISTRIBUTION_PERCENTAGE) / BASIS_POINTS;
        uint256 salesProceedsAmount = msg.value - redistributionAmount;

        // Add to sales proceeds (90% of the payment)
        _totalSalesProceeds += salesProceedsAmount;
        emit SaleProceedsReceived(salesProceedsAmount);

        // Add redistribution amount to current week's rewards
        if (redistributionAmount > 0) {
            _currentWeeklyRewards += redistributionAmount;
            emit SalesRedistributed(redistributionAmount);
        }

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _mint(msg.sender, tokenId);

        emit FounderNFTMinted(msg.sender, tokenId);
    }

    /**
     * @dev Mints multiple Founder NFT with weekly sales redistribution
     */
    function mintMultiple(uint256 quantity) external payable {
        require(_saleActive, "Sale is not active");
        require(quantity > 0 && quantity <= 10, "Invalid quantity"); // Add reasonable limit
        require(totalSupply() + quantity <= _maxSupply, "Max supply exceeded");
        require(msg.value >= _price * quantity, "Insufficient payment");

        // Calculate redistribution for total payment
        uint256 redistributionAmount = (msg.value * SALES_REDISTRIBUTION_PERCENTAGE) / BASIS_POINTS;
        uint256 salesProceedsAmount = msg.value - redistributionAmount;

        _totalSalesProceeds += salesProceedsAmount;
        emit SaleProceedsReceived(salesProceedsAmount);

        if (redistributionAmount > 0) {
            _currentWeeklyRewards += redistributionAmount;
            emit SalesRedistributed(redistributionAmount);
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
     * @dev Add platform fees to current week's reward pool
     */
    function addPlatformFees(uint256 amount) external onlyRole(PLATFORM_ROLE) {
        _currentWeeklyRewards += amount;
        emit FeeDistributionReceived(amount);
    }

    /**
     * @dev Stake token to participate in weekly reward distribution
     */
    function stakeToken(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(_stakedTokens[tokenId].owner == address(0), "Token already staked");

        // Transfer token to this contract
        _transfer(msg.sender, address(this), tokenId);

        // Record staking information
        _stakedTokens[tokenId] =
            StakeInfo({owner: msg.sender, stakedSince: block.timestamp, lastRewardsClaimed: block.timestamp});

        _totalStakedTokens++;

        // Mark as staked for current week
        uint256 currentWeek = getCurrentWeek();
        _tokenStakedDuringWeek[currentWeek][tokenId] = true;

        emit TokenStaked(msg.sender, tokenId);
    }

    /**
     * @dev Unstake token
     */
    function unstakeToken(uint256 tokenId) external nonReentrant {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");
        require(
            block.timestamp >= _stakedTokens[tokenId].stakedSince + _minimumStakingPeriod,
            "Minimum staking period not reached"
        );

        // Transfer token back to owner
        _transfer(address(this), msg.sender, tokenId);

        // Clear staking information
        delete _stakedTokens[tokenId];

        _totalStakedTokens--;

        emit TokenUnstaked(msg.sender, tokenId);
    }

    /**
     * @dev Finalize the current week and start a new one
     */
    function finalizeWeek() external {
        uint256 currentWeek = getCurrentWeek();
        require(currentWeek > _deploymentWeek, "Cannot finalize deployment week");

        uint256 weekToFinalize = currentWeek - 1;
        require(_weeklyRewardPool[weekToFinalize] == 0, "Week already finalized");

        // Snapshot the previous week's data
        _weeklyRewardPool[weekToFinalize] = _currentWeeklyRewards;
        _weeklyStakedCount[weekToFinalize] = _totalStakedTokens;

        // Mark all currently staked tokens as staked during that week
        for (uint256 i = 0; i < totalSupply(); i++) {
            uint256 tokenId = tokenByIndex(i);
            if (_stakedTokens[tokenId].owner != address(0)) {
                _tokenStakedDuringWeek[weekToFinalize][tokenId] = true;
            }
        }

        emit WeeklyEpochFinalized(weekToFinalize, _currentWeeklyRewards, _totalStakedTokens);

        // Reset for new week
        _currentWeeklyRewards = 0;
    }

    /**
     * @dev Claim reward for a specific week for a token
     */
    function claimWeeklyReward(uint256 tokenId, uint256 week) external nonReentrant {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");

        // Validation checks
        require(week < getCurrentWeek(), "Cannot claim current or future week");
        require(_weeklyRewardPool[week] > 0, "Week not finalized or no rewards");
        require(!_hasClaimedWeek[week][tokenId], "Already claimed for this week");
        require(_tokenStakedDuringWeek[week][tokenId], "Token not staked during this week");

        // Calculate reward for this week
        uint256 weekReward = _weeklyRewardPool[week] / _weeklyStakedCount[week];

        // Mark as claimed
        _hasClaimedWeek[week][tokenId] = true;

        // Transfer reward
        (bool success,) = msg.sender.call{value: weekReward}("");
        require(success, "Transfer failed");

        emit WeeklyRewardClaimed(msg.sender, tokenId, week, weekReward);
    }

    /**
     * @dev Claim rewards for all claimable weeks for a token
     */
    function claimAllWeeklyRewards(uint256 tokenId) external nonReentrant {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");

        uint256 currentWeek = getCurrentWeek();
        uint256 totalRewards = 0;

        for (uint256 week = _deploymentWeek; week < currentWeek; week++) {
            if (_weeklyRewardPool[week] > 0 && _tokenStakedDuringWeek[week][tokenId] && !_hasClaimedWeek[week][tokenId])
            {
                uint256 weekReward = _weeklyRewardPool[week] / _weeklyStakedCount[week];
                totalRewards += weekReward;

                // Mark as claimed
                _hasClaimedWeek[week][tokenId] = true;

                emit WeeklyRewardClaimed(msg.sender, tokenId, week, weekReward);
            }
        }

        require(totalRewards > 0, "No rewards to claim");

        // Transfer total rewards
        (bool success,) = msg.sender.call{value: totalRewards}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Get claimable weeks count and total amount for a token
     */
    function getClaimableRewardsInfo(uint256 tokenId) external view returns (uint256 weekCount, uint256 totalAmount) {
        require(_stakedTokens[tokenId].owner != address(0), "Token not staked");

        uint256 currentWeek = getCurrentWeek();
        uint256 count = 0;
        uint256 total = 0;

        for (uint256 week = _deploymentWeek; week < currentWeek; week++) {
            if (_weeklyRewardPool[week] > 0 && _tokenStakedDuringWeek[week][tokenId] && !_hasClaimedWeek[week][tokenId])
            {
                count++;
                total += _weeklyRewardPool[week] / _weeklyStakedCount[week];
            }
        }

        return (count, total);
    }

    /**
     * @dev Get reward amount for a specific week and token
     */
    function getWeekReward(uint256 tokenId, uint256 week) external view returns (uint256) {
        if (_weeklyRewardPool[week] == 0 || !_tokenStakedDuringWeek[week][tokenId] || _hasClaimedWeek[week][tokenId]) {
            return 0;
        }

        return _weeklyRewardPool[week] / _weeklyStakedCount[week];
    }

    /**
     * @dev Get current weekly rewards accumulating
     */
    function getCurrentWeeklyRewards() external view returns (uint256) {
        return _currentWeeklyRewards;
    }

    /**
     * @dev Get week info
     */
    function getWeekInfo(uint256 week) external view returns (uint256 rewards, uint256 stakedCount) {
        return (_weeklyRewardPool[week], _weeklyStakedCount[week]);
    }

    /**
     * @dev Check if token was staked during a specific week
     */
    function tokenStakedDuringWeek(uint256 week, uint256 tokenId) external view returns (bool) {
        return _tokenStakedDuringWeek[week][tokenId];
    }

    /**
     * @dev Check if token has claimed rewards for a specific week
     */
    function hasClaimedWeek(uint256 week, uint256 tokenId) external view returns (bool) {
        return _hasClaimedWeek[week][tokenId];
    }

    // ===== ALL OTHER EXISTING FUNCTIONS (same as before) =====

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

    function isTokenStaked(uint256 tokenId) external view returns (bool) {
        return _stakedTokens[tokenId].owner != address(0);
    }

    function getStakingInfo(uint256 tokenId)
        external
        view
        returns (address owner, uint256 stakedSince, uint256 lastRewardsClaimed)
    {
        StakeInfo memory info = _stakedTokens[tokenId];
        return (info.owner, info.stakedSince, info.lastRewardsClaimed);
    }

    function getTotalStakedTokens() external view returns (uint256) {
        return _totalStakedTokens;
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

    function withdraw() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance - _currentWeeklyRewards;
        require(balance > 0, "No funds to withdraw");

        (bool success,) = msg.sender.call{value: balance}("");
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
