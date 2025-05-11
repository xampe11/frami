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
 * @dev NFT for platform founders with special privileges and staking
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

    // Events
    event FounderNFTMinted(address indexed to, uint256 indexed tokenId);
    event FeeDistributionReceived(uint256 amount);
    event FeeDistributionUpdated(uint256 totalUndistributedFees);
    event FeesDistributed(address indexed to, uint256 amount);
    event SaleProceedsReceived(uint256 amount);
    event EarlyAccessProjectAdded(address indexed projectAddress);
    event EarlyAccessProjectRemoved(address indexed projectAddress);
    event TokenStaked(address indexed owner, uint256 indexed tokenId);
    event TokenUnstaked(address indexed owner, uint256 indexed tokenId);
    event StakingRewardsClaimed(address indexed owner, uint256 indexed tokenId, uint256 amount);
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

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(PLATFORM_ROLE, platformRegistry);
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {
        //emit an event for tracking
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @dev Mint a Founder NFT
     */
    function mint() external payable {
        require(_saleActive, "Sale is not active");
        require(totalSupply() < _maxSupply, "Max supply reached");
        require(msg.value >= _price, "Insufficient payment");

        // Add to sales proceeds
        _totalSalesProceeds += msg.value;
        emit SaleProceedsReceived(msg.value);

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        emit FounderNFTMinted(msg.sender, tokenId);
    }

    /**
     * @dev Batch mint multiple NFTs (for admin use)
     */
    function batchMint(address[] calldata recipients) external onlyRole(ADMIN_ROLE) {
        require(_saleActive, "Sale is not active");
        require(totalSupply() + recipients.length <= _maxSupply, "Exceeds max supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;

            _safeMint(recipients[i], tokenId);

            emit FounderNFTMinted(recipients[i], tokenId);
        }
    }

    /**
     * @dev Check if an address owns a Founder NFT
     */
    function isFounder(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }

    /**
     * @dev Add to undistributed fees
     */
    function addPlatformFees(uint256 amount) external onlyRole(PLATFORM_ROLE) {
        _totalUndistributedFees += amount;
        emit FeeDistributionUpdated(_totalUndistributedFees);
        emit FeeDistributionReceived(amount);
    }

    /**
     * @dev Get platform fee distribution percentage
     */
    function getPlatformFeeDistributionPercentage() external view returns (uint256) {
        return _platformFeeDistributionPercentage;
    }

    /**
     * @dev Get total sales proceeds
     */
    function getTotalSalesProceeds() external view returns (uint256) {
        return _totalSalesProceeds;
    }

    /**
     * @dev Get total undistributed fees
     */
    function getTotalUndistributedFees() external view returns (uint256) {
        return _totalUndistributedFees;
    }

    /**
     * @dev Stake token to participate in fee distribution
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

        emit TokenStaked(msg.sender, tokenId);
    }

    /**
     * @dev Unstake token and claim any pending rewards
     */
    function unstakeToken(uint256 tokenId) external nonReentrant {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");
        require(
            block.timestamp >= _stakedTokens[tokenId].stakedSince + _minimumStakingPeriod,
            "Minimum staking period not reached"
        );

        // Claim any pending rewards
        _claimStakingRewards(tokenId);

        // Transfer token back to owner
        _transfer(address(this), msg.sender, tokenId);

        // Clear staking information
        delete _stakedTokens[tokenId];

        _totalStakedTokens--;

        emit TokenUnstaked(msg.sender, tokenId);
    }

    /**
     * @dev Claim rewards for a staked token
     */
    function claimStakingRewards(uint256 tokenId) external nonReentrant {
        require(_stakedTokens[tokenId].owner == msg.sender, "Not the staker of this token");

        _claimStakingRewards(tokenId);
    }

    /**
     * @dev Internal function to claim staking rewards
     */
    function _claimStakingRewards(uint256 tokenId) internal {
        if (_totalStakedTokens == 0 || _totalUndistributedFees == 0) {
            return;
        }

        uint256 sharePerToken = _totalUndistributedFees / _totalStakedTokens;

        if (sharePerToken == 0) {
            return;
        }

        // Update undistributed fees
        _totalUndistributedFees -= sharePerToken;

        // Update claim timestamp
        _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;

        // Transfer share to token owner
        address owner = _stakedTokens[tokenId].owner;
        (bool success,) = owner.call{value: sharePerToken}("");
        require(success, "Transfer failed");

        emit StakingRewardsClaimed(owner, tokenId, sharePerToken);
    }

    /**
     * @dev Claim fee distribution for all owned tokens
     */
    function claimAllStakingRewards() external nonReentrant {
        uint256 totalClaimed = 0;

        for (uint256 i = 0; i < totalSupply(); i++) {
            uint256 tokenId = tokenByIndex(i);
            if (_stakedTokens[tokenId].owner == msg.sender) {
                if (_totalStakedTokens == 0 || _totalUndistributedFees == 0) {
                    break;
                }

                uint256 sharePerToken = _totalUndistributedFees / _totalStakedTokens;

                if (sharePerToken == 0) {
                    break;
                }

                // Update undistributed fees
                _totalUndistributedFees -= sharePerToken;

                // Update claim timestamp
                _stakedTokens[tokenId].lastRewardsClaimed = block.timestamp;

                totalClaimed += sharePerToken;
            }
        }

        if (totalClaimed > 0) {
            // Transfer total share to token owner
            (bool success,) = msg.sender.call{value: totalClaimed}("");
            require(success, "Transfer failed");

            emit FeesDistributed(msg.sender, totalClaimed);
        }
    }

    /**
     * @dev Withdraw sales proceeds (only admin)
     */
    function withdrawSalesProceeds() external onlyRole(ADMIN_ROLE) {
        uint256 amount = _totalSalesProceeds;
        require(amount > 0, "No sales proceeds to withdraw");

        _totalSalesProceeds = 0;

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Check if a token is currently staked
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
     * @dev Get total number of staked tokens
     */
    function getTotalStakedTokens() external view returns (uint256) {
        return _totalStakedTokens;
    }

    /**
     * @dev Get minimum staking period
     */
    function getMinimumStakingPeriod() external view returns (uint256) {
        return _minimumStakingPeriod;
    }

    /**
     * @dev Set minimum staking period
     */
    function setMinimumStakingPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        _minimumStakingPeriod = newPeriod;
    }

    /**
     * @dev Check if an address has early access to a project
     */
    function hasEarlyAccess(address account, address projectAddress) external view returns (bool) {
        return balanceOf(account) > 0 && _earlyAccessProjects[projectAddress];
    }

    /**
     * @dev Add a project for early access
     */
    function addEarlyAccessProject(address projectAddress) external onlyRole(ADMIN_ROLE) {
        _earlyAccessProjects[projectAddress] = true;
        emit EarlyAccessProjectAdded(projectAddress);
    }

    /**
     * @dev Remove a project from early access
     */
    function removeEarlyAccessProject(address projectAddress) external onlyRole(ADMIN_ROLE) {
        _earlyAccessProjects[projectAddress] = false;
        emit EarlyAccessProjectRemoved(projectAddress);
    }

    /**
     * @dev Get DAO token allocation percentage for founders
     */
    function getDaoTokenAllocationPercentage() external view returns (uint256) {
        return _daoTokenAllocationPercentage;
    }

    /**
     * @dev Get total undistributed fees
     */
    function getUndistributedFees() external view returns (uint256) {
        return _totalUndistributedFees;
    }

    /**
     * @dev Set platform fee distribution percentage
     */
    function setPlatformFeeDistributionPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        require(newPercentage <= 10000, "Invalid percentage");
        _platformFeeDistributionPercentage = newPercentage;
    }

    /**
     * @dev Set DAO token allocation percentage
     */
    function setDaoTokenAllocationPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        require(newPercentage <= 10000, "Invalid percentage");
        _daoTokenAllocationPercentage = newPercentage;
    }

    /**
     * @dev Set sale status
     */
    function setSaleStatus(bool status) external onlyRole(ADMIN_ROLE) {
        _saleActive = status;
    }

    /**
     * @dev Set NFT price
     */
    function setPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) {
        _price = newPrice;
    }

    /**
     * @dev Get NFT metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Updated for v5.3.0

        // You can customize this to return different metadata based on tokenId
        return string(abi.encodePacked(super.tokenURI(tokenId), "/founder"));
    }

    /**
     * @dev Override transfer function for staked tokens in OpenZeppelin 5.x
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721EnumerableUpgradeable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Prevent transfer of staked tokens except by this contract
        if (from != address(0) && to != address(0)) {
            // Skip minting and burning
            require(
                _stakedTokens[tokenId].owner == address(0) || from == address(this) || to == address(this),
                "Cannot transfer staked token"
            );
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Withdraw contract funds (excluding undistributed fees)
     */
    function withdraw() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance - _totalUndistributedFees;
        require(balance > 0, "No funds to withdraw");

        (bool success,) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }

    /**
     * @dev Required override for interface support
     */
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
