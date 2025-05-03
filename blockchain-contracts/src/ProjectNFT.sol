// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Platform registry interface
interface IPlatformRegistry {
    function isProjectRegistered(address) external view returns (bool);
}

contract ProjectNFTStorage {
    // Platform registry
    address internal _platformRegistry;

    // Project tracking
    mapping(address => bool) internal _authorizedProjects;

    // NFT minting tracking
    uint256 internal _tokenIdCounter;

    // NFT tiers
    struct NFTTier {
        string name;
        string description;
        uint256 minInvestment;
        string baseURI;
        bool active;
    }

    // project -> tier ID -> tier data
    mapping(address => mapping(uint256 => NFTTier)) internal _projectTiers;
    mapping(address => uint256) internal _projectTierCount;

    // NFT ownership tracking
    // investor -> project -> bool
    mapping(address => mapping(address => bool)) internal _hasProjectNFT;
}

contract ProjectNFT is
    Initializable,
    ProjectNFTStorage,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Access control roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PROJECT_ROLE = keccak256("PROJECT_ROLE");

    // Events
    event ProjectAuthorized(address indexed project);
    event TierCreated(address indexed project, uint256 indexed tierId);
    event NFTMinted(address indexed to, uint256 indexed tokenId, address indexed project, uint256 tierId);

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
    function initialize(address initialOwner, address platformRegistry) external initializer {
        __ERC721_init("Real World Project Investment", "RWPI");
        __ERC721URIStorage_init();
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _platformRegistry = platformRegistry;

        // Set up access control
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
    }

    /**
     * @dev Authorize project to mint NFTs
     */
    function authorizeProject(address project) external onlyRole(ADMIN_ROLE) {
        require(IPlatformRegistry(_platformRegistry).isProjectRegistered(project), "Invalid project");
        _authorizedProjects[project] = true;
        _grantRole(PROJECT_ROLE, project);

        emit ProjectAuthorized(project);
    }

    /**
     * @dev Create NFT tier for a project
     */
    function createTier(string memory name, string memory description, uint256 minInvestment, string memory baseURI)
        external
        onlyRole(PROJECT_ROLE)
    {
        require(_authorizedProjects[msg.sender], "Not authorized project");

        uint256 tierId = _projectTierCount[msg.sender];

        _projectTiers[msg.sender][tierId] = NFTTier({
            name: name,
            description: description,
            minInvestment: minInvestment,
            baseURI: baseURI,
            active: true
        });

        _projectTierCount[msg.sender]++;

        emit TierCreated(msg.sender, tierId);
    }

    /**
     * @dev Mint NFT for investor
     */
    function mintInvestorNFT(address investor, uint256 tierId) external onlyRole(PROJECT_ROLE) returns (uint256) {
        require(_authorizedProjects[msg.sender], "Not authorized project");
        require(_projectTiers[msg.sender][tierId].active, "Tier not active");
        require(!_hasProjectNFT[investor][msg.sender], "Already has project NFT");

        // Get next token ID
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Mint NFT
        _safeMint(investor, tokenId);
        _setTokenURI(tokenId, _projectTiers[msg.sender][tierId].baseURI);

        // Mark investor as having an NFT for this project
        _hasProjectNFT[investor][msg.sender] = true;

        emit NFTMinted(investor, tokenId, msg.sender, tierId);

        return tokenId;
    }

    /**
     * @dev Disable tier
     */
    function disableTier(uint256 tierId) external onlyRole(PROJECT_ROLE) {
        require(_authorizedProjects[msg.sender], "Not authorized project");
        require(tierId < _projectTierCount[msg.sender], "Invalid tier");

        _projectTiers[msg.sender][tierId].active = false;
    }

    /**
     * @dev Enable tier
     */
    function enableTier(uint256 tierId) external onlyRole(PROJECT_ROLE) {
        require(_authorizedProjects[msg.sender], "Not authorized project");
        require(tierId < _projectTierCount[msg.sender], "Invalid tier");

        _projectTiers[msg.sender][tierId].active = true;
    }

    /**
     * @dev Check if a project is authorized
     */
    function isProjectAuthorized(address project) external view returns (bool) {
        return _authorizedProjects[project];
    }

    /**
     * @dev Get tier count for a project
     */
    function getProjectTierCount(address project) external view returns (uint256) {
        return _projectTierCount[project];
    }

    /**
     * @dev Get tier details
     */
    function getTierDetails(address project, uint256 tierId)
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 minInvestment,
            string memory baseURI,
            bool active
        )
    {
        require(tierId < _projectTierCount[project], "Invalid tier");

        NFTTier storage tier = _projectTiers[project][tierId];
        return (tier.name, tier.description, tier.minInvestment, tier.baseURI, tier.active);
    }

    /**
     * @dev Check if investor has NFT for project
     */
    function hasProjectNFT(address investor, address project) external view returns (bool) {
        return _hasProjectNFT[investor][project];
    }

    /**
     * @dev Get platform registry
     */
    function getPlatformRegistry() external view returns (address) {
        return _platformRegistry;
    }

    /**
     * @dev Update platform registry
     */
    function updatePlatformRegistry(address newRegistry) external onlyRole(ADMIN_ROLE) {
        require(newRegistry != address(0), "Invalid registry address");
        _platformRegistry = newRegistry;
    }

    /**
     * @dev Authorization for upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Additional upgrade logic if needed
    }

    // Override functions required by Solidity

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
