// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {Project} from "../../src/Project.sol";
import {ProjectNFT} from "../../src/ProjectNFT.sol";

contract MockRegistry {
    mapping(address => bool) public registeredProjects;

    function registerProject(address project) external {
        registeredProjects[project] = true;
    }

    function isProjectRegistered(address project) external view returns (bool) {
        return registeredProjects[project];
    }
}

contract ProjectNFTTest is Test {
    ProjectNFT public nft;
    MockRegistry public registry;

    address public owner;
    address public project;
    address public investor1;
    address public investor2;

    event ProjectAuthorized(address indexed project);
    event TierCreated(address indexed project, uint256 indexed tierId);
    event NFTMinted(address indexed to, uint256 indexed tokenId, address indexed project, uint256 tierId);

    function setUp() public {
        owner = address(this);
        project = makeAddr("project");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Create registry and register project
        registry = new MockRegistry();
        registry.registerProject(project);

        // Create NFT contract
        nft = new ProjectNFT(address(registry));
    }

    function testAuthorizeProject() public {
        vm.expectEmit(true, false, false, false);
        emit ProjectAuthorized(project);

        nft.authorizeProject(project);

        assertTrue(nft.authorizedProjects(project), "Project not authorized");
    }

    function testAuthorizeUnregisteredProject() public {
        address unregisteredProject = makeAddr("unregistered");

        vm.expectRevert("Invalid project");
        nft.authorizeProject(unregisteredProject);
    }

    function testCreateTier() public {
        // First authorize project
        nft.authorizeProject(project);

        string memory name = "Gold Tier";
        string memory description = "Premium investor package";
        uint256 minInvestment = 5 ether;
        string memory baseURI = "ipfs://QmXYZ...";

        vm.prank(project);
        vm.expectEmit(true, true, false, false);
        emit TierCreated(project, 0);

        nft.createTier(name, description, minInvestment, baseURI);

        // Check tier data
        (string memory tierName, string memory tierDesc, uint256 tierMinInv, string memory tierURI, bool tierActive) =
            nft.projectTiers(project, 0);

        assertEq(tierName, name, "Tier name mismatch");
        assertEq(tierDesc, description, "Tier description mismatch");
        assertEq(tierMinInv, minInvestment, "Tier min investment mismatch");
        assertEq(tierURI, baseURI, "Tier URI mismatch");
        assertTrue(tierActive, "Tier should be active");

        // Check tier count
        assertEq(nft.projectTierCount(project), 1, "Tier count mismatch");
    }

    function testCreateTierUnauthorized() public {
        // Don't authorize project
        string memory name = "Gold Tier";
        string memory description = "Premium investor package";
        uint256 minInvestment = 5 ether;
        string memory baseURI = "ipfs://QmXYZ...";

        vm.prank(project);
        vm.expectRevert("Not authorized project");

        nft.createTier(name, description, minInvestment, baseURI);
    }

    function testMintInvestorNFT() public {
        // Authorize project
        nft.authorizeProject(project);

        // Create tier
        vm.prank(project);
        nft.createTier("Gold Tier", "Premium", 5 ether, "ipfs://QmXYZ...");

        // Mint NFT
        vm.prank(project);
        vm.expectEmit(true, true, true, true);
        emit NFTMinted(investor1, 0, project, 0);

        uint256 tokenId = nft.mintInvestorNFT(investor1, 0);

        // Check NFT ownership
        assertEq(nft.ownerOf(tokenId), investor1, "NFT ownership mismatch");
        assertEq(tokenId, 0, "Token ID mismatch");
        assertTrue(nft.hasProjectNFT(investor1, project), "Investor should have project NFT");
    }

    function testMintInvestorNFTInactiveTier() public {
        // Authorize project
        nft.authorizeProject(project);

        // Create tier
        vm.prank(project);
        nft.createTier("Gold Tier", "Premium", 5 ether, "ipfs://QmXYZ...");

        // Disable tier
        vm.prank(project);
        nft.disableTier(0);

        // Try to mint NFT
        vm.prank(project);
        vm.expectRevert("Tier not active");

        nft.mintInvestorNFT(investor1, 0);
    }

    function testMintInvestorNFTDuplicate() public {
        // Authorize project
        nft.authorizeProject(project);

        // Create tier
        vm.prank(project);
        nft.createTier("Gold Tier", "Premium", 5 ether, "ipfs://QmXYZ...");

        // Mint first NFT
        vm.prank(project);
        nft.mintInvestorNFT(investor1, 0);

        // Try to mint second NFT
        vm.prank(project);
        vm.expectRevert("Already has project NFT");

        nft.mintInvestorNFT(investor1, 0);
    }

    function testDisableEnableTier() public {
        // Authorize project
        nft.authorizeProject(project);

        // Create tier
        vm.prank(project);
        nft.createTier("Gold Tier", "Premium", 5 ether, "ipfs://QmXYZ...");

        // Disable tier
        vm.prank(project);
        nft.disableTier(0);

        // Check tier is inactive
        (,,,, bool active) = nft.projectTiers(project, 0);
        assertFalse(active, "Tier should be inactive");

        // Enable tier
        vm.prank(project);
        nft.enableTier(0);

        // Check tier is active again
        (,,,, active) = nft.projectTiers(project, 0);
        assertTrue(active, "Tier should be active");
    }

    function testDisableTierInvalidId() public {
        // Authorize project
        nft.authorizeProject(project);

        // Try to disable non-existent tier
        vm.prank(project);
        vm.expectRevert("Invalid tier");

        nft.disableTier(0);
    }

    function testEnableTierInvalidId() public {
        // Authorize project
        nft.authorizeProject(project);

        // Try to enable non-existent tier
        vm.prank(project);
        vm.expectRevert("Invalid tier");

        nft.enableTier(0);
    }
}
