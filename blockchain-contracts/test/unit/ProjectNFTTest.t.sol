// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {Project} from "../../src/Project.sol";
import {ProjectNFT} from "../../src/ProjectNFT.sol";
import {ERC1967Proxy} from "../../src/proxy/ERC1967Proxy.sol";

// Mock Registry for testing
contract MockRegistry {
    mapping(address => bool) public registeredProjects;

    function registerProject(address project) external {
        registeredProjects[project] = true;
    }

    function isProjectRegistered(address project) external view returns (bool) {
        return registeredProjects[project];
    }

    function isSupportedToken(address) external pure returns (bool) {
        return true;
    }
}

contract ProjectNFTTest is Test {
    ProjectNFT public implementation;
    ProjectNFT public nft;
    ERC1967Proxy public proxy;

    address public owner;
    address public project;
    address public investor1;
    address public investor2;
    address public registryAddr;

    function setUp() public {
        owner = address(this);
        project = makeAddr("project");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        // Create mock registry
        MockRegistry registry = new MockRegistry();
        registry.registerProject(project);
        registryAddr = address(registry);

        // Deploy implementation
        implementation = new ProjectNFT();

        // Prepare initialization data
        bytes memory data = abi.encodeWithSelector(ProjectNFT.initialize.selector, owner, registryAddr);

        // Deploy proxy
        proxy = new ERC1967Proxy(address(implementation), data);

        // Cast proxy to implementation type for easier testing
        nft = ProjectNFT(address(proxy));
    }

    function testInitialization() public view {
        assertEq(nft.getPlatformRegistry(), registryAddr, "Wrong registry address");
        assertEq(nft.name(), "Real World Project Investment", "Wrong token name");
        assertEq(nft.symbol(), "RWPI", "Wrong token symbol");
        assertTrue(nft.hasRole(nft.ADMIN_ROLE(), owner), "Owner should have ADMIN_ROLE");
        assertTrue(nft.hasRole(nft.UPGRADER_ROLE(), owner), "Owner should have UPGRADER_ROLE");
    }

    function testAuthorizeProject() public {
        assertFalse(nft.isProjectAuthorized(project), "Project should not be authorized initially");

        nft.authorizeProject(project);

        assertTrue(nft.isProjectAuthorized(project), "Project should be authorized after authorization");
        assertTrue(nft.hasRole(nft.PROJECT_ROLE(), project), "Project should have PROJECT_ROLE");
    }

    function testTierManagement() public {
        // Authorize project first
        nft.authorizeProject(project);

        // Create tier as project
        vm.prank(project);
        nft.createTier("Gold Tier", "Premium investor package", 5 ether, "ipfs://QmXYZ...");

        // Check tier count
        assertEq(nft.getProjectTierCount(project), 1, "Project should have 1 tier");

        // Get tier details
        (string memory name, string memory description, uint256 minInvestment, string memory baseURI, bool active) =
            nft.getTierDetails(project, 0);

        assertEq(name, "Gold Tier", "Wrong tier name");
        assertEq(description, "Premium investor package", "Wrong tier description");
        assertEq(minInvestment, 5 ether, "Wrong minimum investment");
        assertEq(baseURI, "ipfs://QmXYZ...", "Wrong base URI");
        assertTrue(active, "Tier should be active");

        // Disable tier
        vm.prank(project);
        nft.disableTier(0);

        // Check tier inactive
        (,,,, active) = nft.getTierDetails(project, 0);
        assertFalse(active, "Tier should be inactive after disabling");

        // Enable tier
        vm.prank(project);
        nft.enableTier(0);

        // Check tier active again
        (,,,, active) = nft.getTierDetails(project, 0);
        assertTrue(active, "Tier should be active after enabling");
    }

    function testMintNFT() public {
        // Authorize project
        nft.authorizeProject(project);

        // Create tier
        vm.prank(project);
        nft.createTier("Gold Tier", "Premium investor package", 5 ether, "ipfs://QmXYZ...");

        // Mint NFT
        vm.prank(project);
        uint256 tokenId = nft.mintInvestorNFT(investor1, 0);

        // Verify NFT ownership
        assertEq(nft.ownerOf(tokenId), investor1, "Investor should own the NFT");
        assertTrue(nft.hasProjectNFT(investor1, project), "Investor should have project NFT");

        // Try to mint duplicate
        vm.prank(project);
        vm.expectRevert("Already has project NFT");
        nft.mintInvestorNFT(investor1, 0);
    }

    function testUnauthorizedProject() public {
        address unauthorizedProject = makeAddr("unauthorized");

        // Try to create tier
        vm.prank(unauthorizedProject);
        vm.expectRevert();
        nft.createTier("Test Tier", "Test", 1 ether, "test");

        // Try to mint NFT
        vm.prank(unauthorizedProject);
        vm.expectRevert();
        nft.mintInvestorNFT(investor1, 0);
    }

    function testUpgrade() public {
        // Deploy new implementation
        ProjectNFT newImplementation = new ProjectNFT();
        address newImplAddress = address(newImplementation);

        // Start recording logs
        vm.recordLogs();

        // Upgrade
        nft.upgradeToAndCall(address(newImplementation), "");

        // Get the recorded logs
        Vm.Log[] memory logs = vm.getRecordedLogs();

        // Define the expected event signature
        bytes32 upgradeEventSignature = keccak256("Upgraded(address)");

        // Find the Upgraded event and verify the implementation address
        bool foundEvent = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == upgradeEventSignature) {
                // The address parameter is in the second topic
                address upgradedAddress = address(uint160(uint256(logs[i].topics[1])));
                assertEq(upgradedAddress, newImplAddress, "Upgraded to wrong implementation");
                foundEvent = true;
                break;
            }
        }

        assertTrue(foundEvent, "Upgraded event not emitted");

        // Verify state preserved
        assertEq(nft.getPlatformRegistry(), registryAddr, "State not preserved after upgrade");
    }
}
