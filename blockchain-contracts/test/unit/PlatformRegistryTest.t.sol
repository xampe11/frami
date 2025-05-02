// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {PlatformRegistry} from "../../src/PlatformRegistry.sol";
import {Project} from "../../src/Project.sol";
import {VerificationOracle} from "../../src/VerificationOracle.sol";

contract PlatformRegistryTest is Test {
    PlatformRegistry public registry;
    address public owner;
    address public treasury;
    address public oracle;
    address public user1;
    address public user2;

    event ProjectCreated(address indexed projectAddress, address indexed creator);

    function setUp() public {
        owner = address(this);
        treasury = makeAddr("treasury");
        oracle = makeAddr("oracle");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Create verification oracle
        VerificationOracle verificationOracle = new VerificationOracle(1);
        oracle = address(verificationOracle);

        // Initialize registry with 5% fee (500 basis points)
        registry = new PlatformRegistry(500, treasury, oracle);

        // Add tokens
        registry.addSupportedToken(address(0x1));

        // Give users some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testCreateProject() public {
        string memory name = "Test Project";
        string memory description = "Test Description";
        uint256 fundingGoal = 5 ether;
        uint256 duration = 30 days;
        bool isFlexibleFunding = false;
        address[] memory teamMembers = new address[](1);
        teamMembers[0] = user2;

        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit ProjectCreated(address(0), user1); // We don't know the exact address, so using address(0)

        address projectAddr =
            registry.createProject(name, description, fundingGoal, duration, isFlexibleFunding, teamMembers);

        assertTrue(registry.registeredProjects(projectAddr), "Project should be registered");
        Project project = Project(payable(projectAddr));

        // Check project was initialized correctly
        (string memory pName, string memory pDesc, address pCreator, uint256 pFundingGoal,,,, bool pIsFlexibleFunding) =
            project.getProjectDetails();

        assertEq(pName, name, "Project name mismatch");
        assertEq(pDesc, description, "Project description mismatch");
        assertEq(pCreator, user1, "Project creator mismatch");
        assertEq(pFundingGoal, fundingGoal, "Project funding goal mismatch");
        assertEq(pIsFlexibleFunding, isFlexibleFunding, "Project funding type mismatch");

        // Check team members
        assertTrue(project.teamMembers(user1), "Creator should be a team member");
        assertTrue(project.teamMembers(user2), "User2 should be a team member");
    }

    function testUpdatePlatformFee() public {
        uint256 newFee = 300; // 3%
        registry.updatePlatformFee(newFee);
        assertEq(registry.platformFeePercentage(), newFee, "Fee not updated");
    }

    function testUpdatePlatformFeeTooHigh() public {
        uint256 newFee = 1100; // 11% - should fail as max is 10%
        vm.expectRevert("Fee too high");
        registry.updatePlatformFee(newFee);
    }

    function testUpdatePlatformFeeUnauthorized() public {
        uint256 newFee = 300; // 3%
        vm.prank(user1);
        vm.expectRevert();
        registry.updatePlatformFee(newFee);
    }

    function testPausePlatform() public {
        registry.pausePlatform();
        assertTrue(registry.paused(), "Platform should be paused");

        string memory name = "Test Project";
        string memory description = "Test Description";
        uint256 fundingGoal = 5 ether;
        uint256 duration = 30 days;
        bool isFlexibleFunding = false;
        address[] memory teamMembers = new address[](0);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        registry.createProject(name, description, fundingGoal, duration, isFlexibleFunding, teamMembers);

        registry.unpausePlatform();
        assertFalse(registry.paused(), "Platform should be unpaused");
    }

    function testGetProjectCount() public {
        uint256 initialCount = registry.getProjectCount();

        // Create a project
        string memory name = "Test Project";
        string memory description = "Test Description";
        uint256 fundingGoal = 5 ether;
        uint256 duration = 30 days;
        bool isFlexibleFunding = false;
        address[] memory teamMembers = new address[](0);

        vm.prank(user1);
        registry.createProject(name, description, fundingGoal, duration, isFlexibleFunding, teamMembers);

        uint256 newCount = registry.getProjectCount();
        assertEq(newCount, initialCount + 1, "Project count should be incremented");
    }
}
