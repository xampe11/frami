// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Platform registry interface
interface IPlatformRegistry {
    function isProjectRegistered(address) external view returns (bool);
}

contract ProjectNFT is ERC721URIStorage, Ownable {
    // Platform registry
    address public platformRegistry;

    // Project tracking
    mapping(address => bool) public authorizedProjects;

    // NFT minting tracking
    uint256 public tokenIdCounter;

    // NFT tiers
    struct NFTTier {
        string name;
        string description;
        uint256 minInvestment;
        string baseURI;
        bool active;
    }

    // project -> tier ID -> tier data
    mapping(address => mapping(uint256 => NFTTier)) public projectTiers;
    mapping(address => uint256) public projectTierCount;

    // NFT ownership tracking
    // investor -> project -> bool
    mapping(address => mapping(address => bool)) public hasProjectNFT;

    // Events
    event ProjectAuthorized(address indexed project);
    event TierCreated(address indexed project, uint256 indexed tierId);
    event NFTMinted(address indexed to, uint256 indexed tokenId, address indexed project, uint256 tierId);

    constructor(address _platformRegistry) ERC721("Real World Project Investment", "RWPI") Ownable(msg.sender) {
        platformRegistry = _platformRegistry;
    }

    // Authorize project to mint NFTs
    function authorizeProject(address _project) external onlyOwner {
        require(IPlatformRegistry(platformRegistry).isProjectRegistered(_project), "Invalid project");
        authorizedProjects[_project] = true;
        emit ProjectAuthorized(_project);
    }

    // Create NFT tier for a project
    function createTier(string memory _name, string memory _description, uint256 _minInvestment, string memory _baseURI)
        external
    {
        require(authorizedProjects[msg.sender], "Not authorized project");

        uint256 tierId = projectTierCount[msg.sender];

        projectTiers[msg.sender][tierId] = NFTTier({
            name: _name,
            description: _description,
            minInvestment: _minInvestment,
            baseURI: _baseURI,
            active: true
        });

        projectTierCount[msg.sender]++;

        emit TierCreated(msg.sender, tierId);
    }

    // Mint NFT for investor
    function mintInvestorNFT(address _investor, uint256 _tierId) external returns (uint256) {
        require(authorizedProjects[msg.sender], "Not authorized project");
        require(projectTiers[msg.sender][_tierId].active, "Tier not active");
        require(!hasProjectNFT[_investor][msg.sender], "Already has project NFT");

        // Get next token ID
        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;

        // Mint NFT
        _safeMint(_investor, tokenId);
        _setTokenURI(tokenId, projectTiers[msg.sender][_tierId].baseURI);

        // Mark investor as having an NFT for this project
        hasProjectNFT[_investor][msg.sender] = true;

        emit NFTMinted(_investor, tokenId, msg.sender, _tierId);

        return tokenId;
    }

    // Disable tier
    function disableTier(uint256 _tierId) external {
        require(authorizedProjects[msg.sender], "Not authorized project");
        require(_tierId < projectTierCount[msg.sender], "Invalid tier");

        projectTiers[msg.sender][_tierId].active = false;
    }

    // Enable tier
    function enableTier(uint256 _tierId) external {
        require(authorizedProjects[msg.sender], "Not authorized project");
        require(_tierId < projectTierCount[msg.sender], "Invalid tier");

        projectTiers[msg.sender][_tierId].active = true;
    }
}
